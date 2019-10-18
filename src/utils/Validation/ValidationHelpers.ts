import { ValidatorRules, Persisted } from "../../types"
import { IProjectService } from "../../services/project/IProjectService"
import { ObjectId } from "bson"
import { IProject, IPage } from "../../interfaces"
import { IPageService } from "../../services/page/IPageService"

export function isString<T>(key: keyof T, trim = true, message?: string): ValidatorRules<T> {
  return {
    [key]: item => typeof item[key] !== 'string' || !(trim ? item[key].trim() : item[key]) ? message || `${key} must be specified` : null
  } as ValidatorRules<T>
}


export function isGuid<T>(key: keyof T, message?: string): ValidatorRules<T> {
  return {
    [key]: item => !item[key] || !/^[0-9a-f]{24}$/i.test(item[key]) ? message || `${key} must be a hex-string guid` : null
  } as ValidatorRules<T>
}

export function isPrimitiveDictionary<T>(key: keyof T, message?: string): ValidatorRules<T> {
  const validator = item => {
    const nonPrimitiveProperty = Object.keys(item[key])
      .find(k => !isFieldValue(item[key][k]))
    return !nonPrimitiveProperty ? null : (message || `${key} must contain only string, number, boolean or date values`)
  }

  return {
    [key]: validator
  } as ValidatorRules<T>
}

function isFieldValue(value) {
  return value instanceof Date || ['string', 'number', 'boolean'].indexOf(typeof value) !== -1
}

function isNullOrUndefined(value) {
  return value === null || typeof value === 'undefined'
}


export function isFieldArray<T>(key: keyof T, message?: string) : ValidatorRules<T> {
  const validator = function(item) {
    if(!Array.isArray(item[key])) return message || `${key} must be an array of fields`

    for(let i = 0; i < item[key].length; i++) {
      const field = item[key][i]
      if(typeof field.name !== 'string' || field.name.length === 0 
        || typeof field.type !== 'string' || field.type.length === 0 
        || typeof field.required !== 'boolean' 
        || (!isNullOrUndefined(field.defaultValue) && !isFieldValue(field.defaultValue))) {
          return message || `${key} must be an array of fields: field ${i} did not match the format { name: string, type: string, required: boolean, defaultValue?: string | boolean | number | Date }`
      }
    }
  }

  return {
    [key]: validator
  } as ValidatorRules<T>
}

export type ProjectValidator = { (item: any): Promise<string | null>; project?: Persisted<IProject>; }

export function isProject<T>(key: keyof T, userId: ObjectId, projectService: IProjectService, message?: string): ValidatorRules<T> {
  const validator: ProjectValidator = async function(item) {
    const guidError = isGuid(key, message)[key](item)
    if(guidError) return guidError

    validator.project = await projectService.getProject(userId, item[key]).catch(() => null)
    return validator.project ? null : message || `${key} must be a valid project id`
  }

  return {
    [key]: validator
  } as ValidatorRules<T>
}

export type PageValidator = { (item: any): Promise<string | null>; page?: Persisted<IPage>; }

export function isPage<T>(key: keyof T, userId: ObjectId, pageService: IPageService, allowNull = false, message?: string): ValidatorRules<T> {
  const validator: PageValidator = async function(item) {
    if(allowNull && isNullOrUndefined(item[key])) return null
    
    const guidError = isGuid(key, message)[key](item)
    if(guidError) return guidError

    validator.page = await pageService.getPage(userId, item[key]).catch(() => null)
    return validator.page ? null : message || `${key} must be a valid page id`
  }

  return {
    [key]: validator
  } as ValidatorRules<T>
}
