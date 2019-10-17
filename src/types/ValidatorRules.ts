export type ValidatorRules<T> = {
  [key in keyof T]?: (item: T) => string | Promise<string | null> | null
}

export type ValidatorResult<T> = {
  [key in keyof T]?: string
}
