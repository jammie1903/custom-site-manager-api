import * as path from "path"
import { NextFunction, Request, Response } from "express"
import * as logger from "morgan"
import * as bodyParser from "body-parser"
import { Application, ApiReference, ExpressApp, Dictionary } from "express-utils"

@Application(path.join(__dirname, "services"), path.join(__dirname, "controllers"))
@ApiReference("/help")
class App extends ExpressApp {

  // Configure Express middleware.
  protected middleware(): void {
    this.express.use(logger("dev"))
    this.express.use(bodyParser.json())
    this.express.use(bodyParser.urlencoded({ extended: false }))

    this.express.all("*", this.allowHeaders)
  }

  protected errorHandler(err, req: Request, res: Response, next: NextFunction) {
    const statusCode = err.statusCode || err.status || 500
    const message = statusCode >= 500 ? "An unexpected error has occured" : err.message || err.toString()
    const errors = err.fieldErrors
    res.statusCode = statusCode

    if(statusCode >= 500) {
      console.error(err)
    }
      
    res.jsonp({ 
      statusCode, 
      ...(message && {message}),
      ...(errors && {errors})
    })
  }

  private allowHeaders(req: Request, res: Response, next: NextFunction) {
    res.header("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Credentials", "true")
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT")
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, token, Authorization")
    if (req.method === "OPTIONS") {
      res.send()
    } else {
      next()
    }
  }

  protected environmentSettings(): Dictionary<string> {
    return {}
  }
}

const app = new App()

export default app.express
