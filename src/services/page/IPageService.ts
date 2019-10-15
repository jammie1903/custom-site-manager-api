import { ObjectId, ObjectID } from "bson";
import { IPage, IPageTree } from "../../interfaces";
import { Persisted } from "../../types";

export interface IPageService {
  getPage(userId: ObjectId, pageId: string): Promise<Persisted<IPage>>
  getProjectPageTree(userId: ObjectId, projectId: string): Promise<IPageTree[]>
  create(userId: ObjectId, page: IPage): Promise<Persisted<IPage>>
  update(userId: ObjectId, page: Persisted<IPage>): Promise<Persisted<IPage>>
}
