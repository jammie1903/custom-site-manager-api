import { Controller, Autowired, Get, Post, RequestBody } from "express-utils"
import { IUser, IAuthenticationDetails, IAuthenticationUser } from "../interfaces"
import TokenContents from "../decorators/TokenContentsDecorator"
import { IUserService } from "../services/user/IUserService"

@Controller("/user")
export default class UserController {
  @Autowired()
  public userService: IUserService

  @Get("/")
  public getUserDetails(@TokenContents() user: IUser): IUser {
    return user
  }

  @Post("/login")
  public async login(@RequestBody() user: IAuthenticationDetails): Promise<{token: string}> {
    const token = await this.userService.login(user)
    return {token}
  }

  @Post("/")
  public async newUser(@RequestBody() user: IAuthenticationUser): Promise<{token: string}> {
    const token = await this.userService.createUser(user)
    return {token}
  }
}
