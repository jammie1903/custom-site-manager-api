export type ValidatorRules<T> = {
  [key in keyof T]?: (item: T) => string | null
}

export type ValidatorResult<T> = {
  [key in keyof T]?: string
}
