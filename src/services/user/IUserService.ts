import { IUser, IAuthenticationUser } from "../../interfaces/IUser"
import { IAuthenticationDetails } from "../../interfaces/IAuthenticationDetails"

export interface IUserService {
  login(details: IAuthenticationDetails): Promise<string>
  createUser(details: IAuthenticationUser): Promise<string>
}
