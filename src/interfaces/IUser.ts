import { IAuthenticationDetails } from "./IAuthenticationDetails"

export interface IUser {
  email: string,
  firstName: string,
  lastName: string,
}

export interface IAuthenticationUser extends IUser, IAuthenticationDetails {

}
