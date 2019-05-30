    
import { Service } from "express-utils"
import { IMongoService } from "./IMongoService"
import { MongoClient, MongoError, Db } from "mongodb"
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
      if (result) {
        result.id = (result as any)._id
        delete (result as any)._id
      }
      return result as Persisted<T>;
    }

    public async insert<T extends object>(db: Db, collection: string, data: T): Promise<Persisted<T>> {
      const obj: Partial<Persisted<T>> = {...data as object}
      await db.collection(collection).insertOne(obj)

      obj.id = (obj as any)._id
      delete (obj as any)._id
      
      return obj as Persisted<T>;
    }
}