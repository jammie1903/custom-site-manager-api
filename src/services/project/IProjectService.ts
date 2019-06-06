import { ObjectId } from "bson"
import { IProject, IUser } from "../../interfaces"
import { Persisted } from "../../types"

export interface IProjectService {
  getProject(userId: ObjectId, projectId: string): Promise<Persisted<IProject>>
  getAllProjects(userId: ObjectId): Promise<Persisted<IProject>[]>
  create(user: Persisted<IUser>, projectDetails: IProject): Promise<Persisted<IProject>>
  deploy(user: Persisted<IUser>, projectId: string): Promise<Persisted<IProject>> 
}
