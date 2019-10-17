import { Service, Autowired } from "express-utils"
import * as bcrypt from "bcrypt"
import { Unauthorized } from "http-errors"
import { Db } from "mongodb"
import { IUser, IAuthenticationUser, IAuthenticationDetails } from "../../interfaces"
import { IUserService } from "./IUserService"
import { Validator, ValidationError, isString } from "../../utils/Validation"
import { IMongoService } from "../mongo/IMongoService"
import { IJwtService } from "../jwt/IJwtService"
import { ValidatorRules, Persisted } from "../../types"

const userValidator: ValidatorRules<IUser> = {
  ...isString('email'),
  ...isString('firstName'),
  ...isString('lastName')
}

const newPasswordValidator: ValidatorRules<IAuthenticationDetails> = {
  password: user => {
    if(typeof user.password !== 'string' || !user.password) return 'password must be specified'
    if(user.password.length < 8 || !/[A-Z]/.test(user.password)) return 'password must be at least 8 characters and contain at least one capital letter'
    return null
  },
}

const authenticationValidator: ValidatorRules<IAuthenticationDetails> = {
  ...isString('email'),
  ...isString('password', false)
}

@Service("userService")
export default class UserService implements IUserService {
  @Autowired()
  private mongoService: IMongoService
  @Autowired()
  private jwtService: IJwtService

  public async login(details: IAuthenticationDetails): Promise<string> {
    const errors = await Validator.create(authenticationValidator).validate(details)
    if(Object.keys(errors).length) {
      throw new ValidationError('Not all fields were present or correct', errors)
    }

    const user = await this.mongoService.run(db => this.getUser(db, details.email))

    if(!user || !(await bcrypt.compare(details.password, user.password))) {
      throw new Unauthorized("Username or password were not valid")
    }
    
    delete user.password
    return this.jwtService.create(user)
  }

  private async getUser(db: Db, email: string): Promise<Persisted<IAuthenticationUser>> {
    return this.mongoService.get<IAuthenticationUser>(db, "users", {email})
  }

  public async createUser(details: IAuthenticationUser): Promise<string> {
    const errors = await Validator.create(userValidator).with(newPasswordValidator).validate(details)
    if(Object.keys(errors).length) {
      throw new ValidationError('Not all fields were present or correct', errors)
    }

    const user = await this.mongoService.run(async db => {
      const existingUser = await this.getUser(db, details.email)

      if(existingUser) {
        throw new ValidationError('Not all fields were present or correct', {email: "This email address is already in use"})
      }

      const user: IUser = {
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
      }

      return this.mongoService.insert<IAuthenticationUser>(db, "users", {
        ...user,
        password: await bcrypt.hash(details.password, 10)
      })
    })

    delete user.password
    return this.jwtService.create(user)
  }
}
