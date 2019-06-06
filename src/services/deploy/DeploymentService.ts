import * as Heroku from 'heroku-client'
import { IProject, IUser } from '../../interfaces'
import { BadRequest } from 'http-errors'
import { Persisted } from '../../types'
import { IDeploymentService } from './IDeploymentService'
import { Service, Autowired } from 'express-utils'
import { IJwtService } from '../jwt/IJwtService'
const heroku = new Heroku({ token: process.env.HEROKU_TOKEN })

const projectTarbellUrl = 'https://github.com/jammie1903/custom-site-builder/tarball/master/'

@Service('deploymentService')
export default class DeploymentService implements IDeploymentService {
  @Autowired()
  private jwtService: IJwtService
  
  public deploy(user: Persisted<IUser>, project: Persisted<IProject>) {
    if(project.build) {
      if(project.build.status === 'pending') {
        throw new BadRequest('This project is already being deployed')
      }
      if(project.build.initalBuild && project.build.status === 'failed') {
        return this.setupProject(this.jwtService.create(user), project)
      }
      return this.rebuild(this.jwtService.create(user), project)
    }
    return this.setupProject(this.jwtService.create(user), project)
  }

  private async rebuild(userToken: string, project: IProject) {
    try {
      const build = await heroku.post(`/apps/${project.externalId}/builds`, { body: {
        source_blob: { url: projectTarbellUrl }
      }})
      project.build = {
        buildId: build.id,
        status: 'pending',
        initalBuild: false,
        startDate: new Date(build.created_at)
      }
    } catch(e) {
      project.build = {
        buildId: null,
        status: 'failed',
        initalBuild: false,
        startDate: new Date(),
        statusMessage: `${e.body.id} = ${e.body.message}`
      }
    }
  }

  private async setupProject(userToken: string, project: Persisted<IProject>) {
    try {
      const setup = await heroku.post('/app-setups', { body: {
        source_blob: { url: projectTarbellUrl },
        app: {
          name: project.siteName
        },
        overrides: {
          env: { 
            USER_TOKEN: userToken,
            PROJECT_ID: project.id
          } 
        }
      }})

      project.externalId = setup.app.id
      project.build = {
        buildId: setup.id,
        status: 'pending',
        initalBuild: true,
        startDate: new Date(setup.created_at)
      }
    } catch(e) {
      project.build = {
        buildId: null,
        status: 'failed',
        initalBuild: false,
        startDate: new Date(),
        statusMessage: `${e.body.id} = ${e.body.message}`
      }
    }
  }

  async poll(project: IProject) {
    if(!project.build || !project.build.buildId || project.build.status !== 'pending') {
      throw new Error('Project is not currectly building')
    }
    const url = project.build.initalBuild ? `/app-setups/${project.build.buildId}` : `/apps/${project.siteName}/builds/${project.build.buildId}`

    try {
      const poll = await heroku.get(url);
      if (poll.status !== 'pending') {
        project.build.status = poll.status

        if(poll.resolved_success_url) {
          project.url = poll.resolved_success_url
        }

        if(poll.failure_message) {
          project.build.statusMessage = poll.failure_message
        }
      }
    }
    catch (e) {
      console.log(e)
      project.build.status = 'failed'
      project.build.statusMessage = `${e.body.id} = ${e.body.message}`
    }
  }
}
