import { Persisted } from '../types'
import { ObjectId } from 'bson'

export default (list: Persisted<{next: ObjectId}>[] ) => {
  const returnList = []
  if(!list || !list.length) {
    return returnList
  }
  const unadded = [...list]
  const links: {[key: string]: Persisted<{next: ObjectId}>} = {}

  list.forEach(element => {
    if(element.next) {
      const linkedItem = list.find(i => i.id.equals(element.next))
      links[element.id.toHexString()] = linkedItem
      unadded.splice(unadded.indexOf(linkedItem), 1)
    }
  })

  if(unadded.length !== 1) {
    throw new Error('links were not set up correctly')
  }
  let current = unadded[0]
  while(current) {
    returnList.push(current)
    current = links[current.id.toHexString()]
  }

  return returnList
}
