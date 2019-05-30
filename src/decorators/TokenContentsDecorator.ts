import { registerEndpointParameterDecorator } from "express-utils"
import { Request } from "express"
import { BadRequest } from "http-errors"
import { ServiceCache } from "express-utils"
import { IJwtService } from "../services/jwt/IJwtService"

export default function TokenContents() {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    registerEndpointParameterDecorator(target, propertyKey, parameterIndex, (request: Request) => {
      const header = request.header("authorization")
      if (!header || !header.trim() || !header.trim().toLowerCase().startsWith("bearer ")) {
        throw new BadRequest("bearer authentication must be provided")
      }
      const token = header.trim().substr(7).trim()
      return (ServiceCache.get("jwtService") as IJwtService).unpack(token)
    })
  }
}
