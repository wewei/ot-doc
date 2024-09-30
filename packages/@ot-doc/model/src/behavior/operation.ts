import { $Var } from "./variable";

declare const symOp: unique symbol;
export type $Op = { [symOp]: typeof symOp };

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
export type ArrayOp<T> = { d: ArrayOplet<T>[]; i: ArrayOplet<T>[] };

/**
 * Update a dict
 */
export type DictOp<T> = Record<string, Op<T>>

/**
 * Struct op
 */
export type ObjectOp<T extends object> = Partial<{ [K in keyof T]: Op<T[K]> }>;

export type Op<T> = T extends $Var
  ? $Op
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

export type Updater<T> = (v: T) => Op<T>;

export type GeneralUpdater<T> = T extends Prim
  ? Updater<T>
  : T extends Array<any>
  ? Updater<T>
  : T extends object
  ?
      | Updater<T>
      | Partial<{
          [K in keyof T]: Updater<T[K]>;
        }>
  : never;

export const updater = <T>(g: GeneralUpdater<T>): Updater<T> => {
  if (typeof g === 'function') return g;
  const gStt = g as Partial<{ [K in keyof T]: Updater<T[K]> }>;
  return (stt) => Object.keys(g).reduce((m, key) => {
    const keyG = key as keyof typeof gStt;
    const keyOp = key as keyof Op<T> & string;
    const f = gStt[keyG];
    if (f)  {
    (m as any)[keyOp] = updater<any>(f)((stt as any)[key]);
    }
    return m;
  }, {} as Op<T>);
}
