import { ObjectId } from "bson"

export interface IProjectBuildStatus {
  buildId: string
  initalBuild: boolean
  startDate: Date
  status: 'succeeded' | 'failed' | 'pending'
  statusMessage?: string
}

export interface IProject {
  userId: ObjectId
  externalId?: string
  projectName: string
  siteName: string
  url?: string
  build?: IProjectBuildStatus
}
