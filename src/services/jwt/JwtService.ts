import { Service, Autowired } from "express-utils"
import { IJwtService } from "./IJwtService"
import * as jwt from "jsonwebtoken"
import { ISecretService } from "../secret/ISecretService"
import { Unauthorized } from "http-errors"

@Service("jwtService")
export default class JwtService implements IJwtService {

  @Autowired()
  private secretService: ISecretService

  create<T extends object>(tokenBody: T): string {
    return jwt.sign(tokenBody, this.secretService.get())
  }

  unpack<T extends object>(token: string): T {
    try {
      return jwt.verify(token, this.secretService.get())
    } catch (err) {
      throw new Unauthorized(err.message ? err : err.message)
    }
  }
}