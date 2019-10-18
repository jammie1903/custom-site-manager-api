import { ObjectId } from 'bson'
import { compare } from 'bcrypt';

export function asString(objectId: string | ObjectId) {
  if(!objectId) return null
  return typeof objectId === 'string' ? objectId : objectId.toHexString()
}

export function asObjectId(objectId: string | ObjectId) {
  if(!objectId) return null
  return objectId instanceof ObjectId ? objectId : ObjectId.createFromHexString(objectId)
}

export function equals(a: string | ObjectId, b: string | ObjectId) {
  const aObject = asObjectId(a)
  return aObject ? aObject.equals(b) : !asObjectId(b)
}