import { ObjectId } from "bson"

export type Persisted<T> = T & {
  id: ObjectId
}
