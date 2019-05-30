import { Db } from "mongodb"
import { Persisted } from "../../types";

export interface IMongoService {
  run<T>(fn: (db: Db) => T | Promise<T>): Promise<T>
  get<T extends object>(db: Db, collection: string, query: object): Promise<Persisted<T>> 
  insert<T extends object>(db: Db, collection: string, data: T): Promise<Persisted<T>>
}
