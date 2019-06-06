import { BadRequest } from "http-errors";

export default class ValidationError extends BadRequest {
  constructor(message: string, public fieldErrors: object) {
    super(message)
  }
}
