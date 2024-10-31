import { $Var, $OpVar } from "./variables";

export type Prim = string | number | boolean;

/**
 * Update a primitive value
 * @param o the old value
 * @param n to value
 */
export type PrimOp<T extends Prim> = {
  o?: T;
  n?: T;
  t: number;
};

/**
 * Update a segment in an array, could be deletion or insertion
 * @param i index
 * @param a array of values
 */
export type ArrayOplet<T> = { i: number; a: T[] };

/**
 * Update array
 * @param d deletions
 * @param i insertions
 */
export type ArrayOp<T> = Partial<{ d: ArrayOplet<T>[]; i: ArrayOplet<T>[] }>;

/**
 * Struct op
 */
export type ObjectOp<T extends object> = Partial<{ [K in keyof T]: Op<T[K]> }>;

export type Op<T> = T extends $Var
  ? $OpVar
  : T extends string
  ? PrimOp<string>
  : T extends number
  ? PrimOp<number>
  : T extends boolean
  ? PrimOp<boolean>
  : T extends Array<infer E>
  ? ArrayOp<E>
  : T extends object
  ? ObjectOp<T>
  : never;

export type Action<T> = (v: T) => Op<T>;