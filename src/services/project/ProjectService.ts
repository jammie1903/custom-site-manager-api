import { ObjectId } from 'bson'
import { Service, Autowired } from 'express-utils'
import { BadRequest, NotFound } from "http-errors"
import { Db } from 'mongodb'
import { IProject, IUser } from '../../interfaces'
import { Persisted, ValidatorRules } from '../../types'
import { IProjectService } from './IProjectService'
import { IMongoService } from '../mongo/IMongoService'
import { isString, isGuid, ValidationError, Validator } from '../../utils/Validation'
import { IDeploymentService } from '../deploy/IDeploymentService'

const projectValidator: ValidatorRules<IProject> = {
  ...isString('projectName'),
  ...isString('siteName')
}

@Service('projectService')
export default class ProjectService implements IProjectService {
  @Autowired()
  private mongoService: IMongoService

  @Autowired()
  private deploymentService: IDeploymentService
  
  public getProject(userId: ObjectId, projectId: string): Promise<Persisted<IProject>> {
    const errors = Validator.create(isGuid('projectId')).validate({projectId})
    if(Object.keys(errors).length) {
      throw new ValidationError('Not all fields were present or correct', errors)
    }

    return this.mongoService.run(async db => {
      const project = await this.mongoService.get<IProject>(db, 'projects', {
        userId, _id: ObjectId.createFromHexString(projectId)
      })

      if(!project) {
        throw new NotFound('project could not be found')
      }

      await this.pollProject(db, project)
      return project
    })
  }

  private async pollProject(db: Db, project: Persisted<IProject>): Promise<void> {
    if(project && project.build && project.build.status === 'pending') {
      await this.deploymentService.poll(project)
      if(project.build.status !== 'pending') {
        await this.mongoService.update(db, 'projects', project)
      }
    }
  }

  public getAllProjects(userId: ObjectId): Promise<Persisted<IProject>[]> {
    return this.mongoService.run(async db => {
      const projects = await this.mongoService.getAll<IProject>(db, 'projects', {userId})
      for(const project of projects) {
        await this.pollProject(db, project)
      }
      return projects
    })
  }

  public async create(user: Persisted<IUser>, projectDetails: IProject): Promise<Persisted<IProject>> {
    const errors = Validator.create(projectValidator).validate(projectDetails)
    if(Object.keys(errors).length) {
      throw new ValidationError('Not all fields were present or correct', errors)
    }

    return this.mongoService.run(async db => {
      const project = await this.mongoService.insert<IProject>(db, 'projects', {
        projectName: projectDetails.projectName,
        siteName: projectDetails.siteName,
        userId: user.id
      })

      await this.deploymentService.deploy(user, project)

      if(project.build.status === 'failed') {
        await this.mongoService.delete(db, 'projects', project)
        throw new BadRequest(project.build.statusMessage)
      } 

      await this.mongoService.update(db, 'projects', project)
      return project
    })
  }

  public async deploy(user: Persisted<IUser>, projectId: string): Promise<Persisted<IProject>> {
    const project = await this.getProject(user.id, projectId)

    await this.deploymentService.deploy(user, project)
    await this.mongoService.run(async db => this.mongoService.update(db, 'projects', project))
    return project
  }
}
