import { Controller, Autowired, Get, Post, RequestBody, RequestParam } from "express-utils"
import { IUser, IProject } from "../interfaces"
import TokenContents from "../decorators/TokenContentsDecorator"
import { IProjectService } from "../services/project/IProjectService"
import { Persisted } from "../types"
import { IDeploymentService } from "../services/deploy/IDeploymentService";

@Controller("/project")
export default class ProjectController {
  @Autowired()
  public projectService: IProjectService

  @Autowired()
  public deploymentService: IDeploymentService

  @Get("/:id([0-9a-fA-F]+)")
  public getProject(@TokenContents() user: Persisted<IUser>, @RequestParam('id') id : string): Promise<Persisted<IProject>> {
    return this.projectService.getProject(user.id, id)
  }

  @Get("/all")
  public getAllProjects(@TokenContents() user: Persisted<IUser>): Promise<Persisted<IProject>[]> {
    return this.projectService.getAllProjects(user.id)
  }

  @Post("/")
  public async newProject(@TokenContents() user: Persisted<IUser>, @RequestBody() project: IProject): Promise<Persisted<IProject>> {
    return this.projectService.create(user, project)
  }

  @Post("/deploy/:id")
  public async deployProject(@TokenContents() user: Persisted<IUser>, @RequestParam('id') id : string): Promise<Persisted<IProject>> {
    return this.projectService.deploy(user, id)
  }
}
