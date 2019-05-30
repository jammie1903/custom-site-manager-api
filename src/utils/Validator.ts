import { ValidatorRules, ValidatorResult } from "../types";

function combine<X,Y>(x: ValidatorRules<X>, y: ValidatorRules<Y>): ValidatorRules<X & Y> {
  let returnValue: ValidatorRules<X & Y> = { ...(x as object) } as ValidatorRules<X & Y>;
  Object.keys(y).forEach(key => {
    const method: (item: X & Y) => string = y[key]

    if(returnValue.hasOwnProperty(key)) {
      const original = returnValue[key];
      returnValue[key] = item => original(item) || method(item);
    } else {
      returnValue[key] = method
    }
  })
  return returnValue;
}

export default class Validator<T> {
  private constructor(private rules: ValidatorRules<T>) {
    
  }

  public static create<T>(rules: ValidatorRules<T>): Validator<T> {
    return new Validator(rules);
  }

  public with<S>(rules: ValidatorRules<S>): Validator<T & S> {
    return new Validator(combine(this.rules, rules));
  }

  public validate(item: T): ValidatorResult<T> {
    const returnObject: ValidatorResult<T> = {};
    for(let field in this.rules) {
      const error = this.rules[field](item)
      if(error && error.length) {
        returnObject[field] = error
      }
    }
    
    return returnObject;
  }
}
