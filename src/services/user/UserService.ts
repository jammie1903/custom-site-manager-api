import { Service, Autowired } from "express-utils";
import * as bcrypt from "bcrypt";
import { Unauthorized } from "http-errors";
import { Db } from "mongodb";
import { IUser, IAuthenticationUser, IAuthenticationDetails } from "../../interfaces";
import { IUserService } from "./IUserService";
import Validator from "../../utils/Validator";
import ValidationError from "../../utils/ValidationError";
import { IMongoService } from "../mongo/IMongoService";
import { IJwtService } from "../jwt/IJWTService";
import { ValidatorRules, Persisted } from "../../types";

const userValidator: ValidatorRules<IUser> = {
  email: user => typeof user.email !== 'string' || !user.email.trim() ? 'email must be specified' : null,
  firstName: user => typeof user.firstName !== 'string' || !user.firstName.trim() ? 'firstName must be specified' : null,
  lastName: user => typeof user.lastName !== 'string' || !user.lastName.trim() ? 'lastName must be specified' : null
}

const authenticationDetailsValidator: ValidatorRules<IAuthenticationDetails> = {
  email: user => typeof user.email !== 'string' || !user.email.trim() ? 'email must be specified' : null,
  password: user => {
    if(typeof user.password !== 'string' || !user.password) return 'password must be specified';
    if(user.password.length < 8 || !/[A-Z]/.test(user.password)) return 'password must be at least 8 charcters and contain at least one capital letter';
    return null
  },
}

@Service("userService")
export default class UserService implements IUserService {
  @Autowired()
  private mongoService: IMongoService
  @Autowired()
  private jwtService: IJwtService

  public async login(details: IAuthenticationDetails): Promise<string> {
    const errors = Validator.create(authenticationDetailsValidator).validate(details)
    if(Object.keys(errors).length) {
      throw new ValidationError('Not all fields were present or correct', errors)
    }

    const user = await this.mongoService.run(db => this.getUser(db, details.email))

    if(!user || !(await bcrypt.compare(details.password, user.password))) {
      throw new Unauthorized("Username or password were not valid")
    }
    
    delete user.password;
    return this.jwtService.create(user);
  }

  private async getUser(db: Db, email: string): Promise<Persisted<IAuthenticationUser>> {
    return this.mongoService.get(db, "users", {email})
  }

  public async createUser(details: IAuthenticationUser): Promise<string> {
    const errors = Validator.create(userValidator).with(authenticationDetailsValidator).validate(details)
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

    delete user.password;
    return this.jwtService.create(user);
  }
}
