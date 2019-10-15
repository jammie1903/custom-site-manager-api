import { Controller, Autowired, Get, Post, RequestBody, RequestParam, Put } from "express-utils"
import { IUser, IPage, IPageTree } from "../interfaces"
import TokenContents from "../decorators/TokenContentsDecorator"
import { IPageService } from "../services/page/IPageService"
import { Persisted } from "../types"

@Controller("/page")
export default class PageController {
  @Autowired()
  public pageService: IPageService


  @Get("/:id([0-9a-fA-F]+)")
  public getPage(@TokenContents() user: Persisted<IUser>, @RequestParam('id') id : string): Promise<Persisted<IPage>> {
    return this.pageService.getPage(user.id, id)
  }

  @Get("/project/tree/:id([0-9a-fA-F]+)")
  public geProjectPageTree(@TokenContents() user: Persisted<IUser>, @RequestParam('id') id : string): Promise<IPageTree[]> {
    return this.pageService.getProjectPageTree(user.id, id)
  }

  @Post("/")
  public async newPage(@TokenContents() user: Persisted<IUser>, @RequestBody() page: IPage): Promise<Persisted<IPage>> {
    return this.pageService.create(user.id, page)
  }

  @Put("/")
  public async updatePage(@TokenContents() user: Persisted<IUser>, @RequestBody() page: Persisted<IPage>): Promise<Persisted<IPage>> {
    return this.pageService.update(user.id, page)
  }
}
