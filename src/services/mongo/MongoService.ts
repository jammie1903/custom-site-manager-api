    
import { Service } from "express-utils"
import { IMongoService } from "./IMongoService"
import { MongoClient, MongoError, Db, Cursor, FilterQuery } from "mongodb"
import { Persisted } from "../../types";

const connectionString = process.env.MONGO_CONNECTION_STRING
const database = process.env.MONGO_DATABASE

@Service("mongoService")
export default class MongoService implements IMongoService {
  public run<T>(fn: (db: Db) => T | Promise<T>): Promise<T> {
    if(!connectionString && !database) {
      throw new Error("Mongo DB connection details have not been provided")
    }

    return new Promise<T>((res, rej) => {
      MongoClient.connect(connectionString, async (err: MongoError, db: MongoClient) => {
        if (err) {
          rej(err)
        }
        try {
          res(await fn(db.db(database)))
        } catch (e) {
          rej(e)
        } finally {
          db && db.close()
        }
      })
    })
  }

  public async get<T extends object>(db: Db, collection: string, query: object): Promise<Persisted<T>> {
    const result: Partial<Persisted<T>> = await db.collection(collection).findOne(query)
    if (!result) {
      return null
    }
    const {_id, ...data} = (result as any)
    data.id = _id
    return data as Persisted<T>
  }
  
  public getAll<T extends object>(db: Db, collection: string, query: object, fields: Array<keyof T> = null): Promise<Persisted<T>[]> {
    const projection = fields && fields.reduce((acc, f) => {
      acc[f] = 1
      return acc
    }, {} as {[key in keyof T]?: number}) 

    const result: Cursor<Persisted<T>> = projection ? db.collection(collection).find(query, projection) : db.collection(collection).find(query)

    return new Promise<Persisted<T>[]>((res, rej) => {
      const returnList: Persisted<T>[] = [];
      result.forEach((item: Persisted<T>) => {
        const {_id, ...data} = (item as any)
        data.id = _id
        returnList.push(data)
      }, (err) => {
        err ? rej(err) : res(returnList)
      });
    })
  }

  public async insert<T extends object>(db: Db, collection: string, data: T): Promise<Persisted<T>> {
    const obj: Partial<Persisted<T>> = {...data as object}
    await db.collection(collection).insertOne(obj)

    obj.id = (obj as any)._id
    delete (obj as any)._id
    
    return obj as Persisted<T>
  }

  public async update<T extends object>(db: Db, collection: string, data: Persisted<T>): Promise<void> {
    const id = data.id
    const obj = {...data as object}
    delete (obj as any).id
    await db.collection(collection).updateOne({_id: id}, {$set: obj})
  }

  public async updateWhere<T extends object>(db: Db, collection: string, condition: FilterQuery<Persisted<T>>, data: Partial<T>): Promise<number> {
    const c: FilterQuery<Persisted<T>> = {...condition as object}
    if(c.id) {
      (c as any)._id = c.id
      delete c.id
    }

    const update = await db.collection(collection).updateMany(c, {$set: data})
    return update.modifiedCount
  }

  public async delete<T extends object>(db: Db, collection: string, data: Persisted<T>): Promise<void> {
    await db.collection(collection).deleteOne({_id: data.id})
  }
}