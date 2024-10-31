import { BehaviorDef } from './behavior';
import { $Var } from './hkt';
import { $Struct, AnyDict, Dict, mapStruct, reduceDict } from './struct';
import { Preset } from './preset';
import { Signatured } from './signatured';
import { Eq } from './eq';

export type Readable<T> = (
  raise: (path: string) => (message: string) => void,
) => (u: unknown) => T;

export type Read<T = $Var> = {
  read: Readable<T>;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export const readData =
  <T>({ read }: Read<T>) =>
  (u: unknown, onError: (message: string) => void = noop) => 
    read(path => message => onError(`${message}, at $${path}`))(u);

const withRead = <T>(read: Readable<T>): Read<T> => ({ read });

const withReadPrim = <T extends string | number | boolean>({
  preset,
  signature,
}: Preset<T> & Signatured): Read<T> =>
  withRead((raise) => (u) => {
    if (typeof u === typeof preset) {
      return u as T;
    }
    raise('')(`requires ${signature}`);
    return preset;
  });

const readable: BehaviorDef<Read, Preset & Signatured & Eq> = {
  $string: withReadPrim,
  $number: withReadPrim,
  $boolean: withReadPrim,
  $array:
    ({ preset, signature }) =>
    ({ read }) =>
      withRead((raise) => (u) => {
        if (!Array.isArray(u)) {
          raise('')(`requires ${signature}`);
          return preset;
        }
        return u.map((e, i) => read((path) => raise(`[${i}]${path}`))(e));
      }),
  $dict:
    ({ preset, signature }) =>
    ({ read, preset: presetV, eq }) =>
      withRead((raise) => (u) => {
        if (typeof u !== 'object' || !u) {
          raise('')(`requires ${signature}`);
          return preset;
        }
        return reduceDict(u as Dict<unknown>, (m, v, key) => {
          const val = read((path) => raise(`.${key}${path}`))(v);
          if (!eq(val)(presetV)) {
            m[key] = val;
          }
          return m;
        }, {} as AnyDict);
      }),
  $struct:
    ({ preset, signature }) =>
    (stt) =>
      withRead((raise) => (u) => {
        if (typeof u !== 'object' || !u) {
          raise('')(`requires ${signature}`);
          return preset;
        }
        return mapStruct(stt, ({ read }, key) =>
          read((path) => raise(`.${key as string}${path}`))(
            (u as $Struct<unknown, typeof stt>)[key],
          ),
        );
      }),
};

export default readable;