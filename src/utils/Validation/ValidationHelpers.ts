import { ValidatorRules } from "../../types"

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
