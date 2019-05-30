import { Controller, Get } from "express-utils"

@Controller("/")
export default class MainController {
  @Get("/")
  public ping(): string {
    return "ping"
  }
}
