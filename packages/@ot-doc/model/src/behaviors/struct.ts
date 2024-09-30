import { $ } from './hkt';

export type Dict<T> = Record<string, T>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDict = Dict<any>;
export type $Struct<T, S extends AnyDict> = { [K in keyof S]: $<T, S[K]> };

export const reduceStruct = <T extends AnyDict, U>(
  t: T,
  f: <K extends keyof T>(u: U, v: T[K], key: K) => U,
  u: U
): U =>
  Object.keys(t).reduce(
    <K extends keyof T>(m: U, k: K) => f(m, t[k], k),
    u as U
  );

export const mapStruct = <T extends AnyDict, F>(
  t: T,
  f: <K extends keyof T>(v: T[K], key: K) => $<F, T[K]>,
): $Struct<F, T> =>
  reduceStruct(
    t,
    (m, v, k) => {
      m[k] = f(v, k);
      return m;
    },
    {} as $Struct<F, T>,
  );

export const reduceDict = reduceStruct as <T, U>(
  dict: Dict<T>,
  f: (u: U, v: T, key: string) => U,
  u: U,
) => U;

export const mapDict = mapStruct as <T, V>(
  dict: Dict<T>,
  f: (t: T, key: string) => V,
) => Dict<V>;