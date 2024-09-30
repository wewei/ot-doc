import { Op } from "./operation";
import { $OpVar, $Var } from "./variables";


// Type application (substitutes type variables with types)
export type $<T, S = $Var> = T extends $Var
  ? S
  : T extends $OpVar
  ? Op<S>
  : T extends undefined | null | boolean | string | number
  ? T
  : T extends Array<infer A>
  ? $<A, S>[]
  : T extends (...args: infer Args) => infer R
  ? (...x: { [K in keyof Args]: $<Args[K], S> }) => $<R, S>
  : T extends object
  ? { [K in keyof T]: $<T[K], S> }
  : T;

export type { $Var };
