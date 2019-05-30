import { ObjectId } from "bson";

export type Persisted<T> = {
  [key in keyof T]?: any
} & {
  id: ObjectId
}
