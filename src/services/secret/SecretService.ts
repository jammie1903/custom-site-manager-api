import { Service } from "express-utils"
import { ISecretService } from "./ISecretService"
import * as crypto from "crypto"
const DEFAULT_SECRET = "DEFAULT_SECRET_FOR_THE_API"

@Service("secretService")
export default class SecretService implements ISecretService {
  private secret: string

  public onInit(): void {
    if (process.env.SECRET) {
      this.secret = process.env.SECRET
    } else {
      console.error("No secret has been set for the api. Please set the SECRET enviroment variable. A default secret will be used for development purposes")
      this.secret = DEFAULT_SECRET
    }
  }

  public get(): string {
    return this.secret
  }

  public encrypt(text: string): string {
    const cipher = crypto.createCipher('aes-256-ctr', this.secret)
    let crypted = cipher.update(text, 'utf8', 'hex')
    crypted += cipher.final('hex')
    return crypted
  }

  public decrypt(text: string): string {
    const decipher = crypto.createDecipher('aes-256-ctr', this.secret)
    let dec = decipher.update(text, 'hex', 'utf8')
    dec += decipher.final('utf8')
    return dec
  }
}
