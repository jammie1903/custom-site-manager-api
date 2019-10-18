import { Db, FilterQuery } from 'mongodb'
import { Persisted } from '../../types'

export interface IMongoService {
  run<T>(fn: (db: Db) => T | Promise<T>): Promise<T>
  get<T extends object>(db: Db, collection: string, query: object): Promise<Persisted<T>>
  getAll<T extends object>(db: Db, collection: string, query: object, fields: Array<keyof T>): Promise<Persisted<T>[]>
  getAll<T extends object>(db: Db, collection: string, query: object): Promise<Persisted<T>[]>
  insert<T extends object>(db: Db, collection: string, data: T): Promise<Persisted<T>>
  update<T extends object>(db: Db, collection: string, data: Persisted<T>): Promise<void>
  updateWhere<T extends object>(db: Db, collection: string, condition: FilterQuery<Persisted<T>>, data: Partial<T>): Promise<number>
  delete<T extends object>(db: Db, collection: string, data: Persisted<T>): Promise<void>
}
