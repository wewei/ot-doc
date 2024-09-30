import { Maybe, just, nothing } from "./maybe";
import { BehaviorDef } from "./behavior";
import { $Var } from "./variables";
import { Action, ObjectOp, Op, Prim } from "./operation";
import { $Struct, reduceDict, reduceStruct } from "./struct";
import { Eq } from "./eq";
import { Preset } from "./preset";

export type Result<T> = { value: T, op: Op<T> };

export type Update<T> = (action: Action<T>) => (a: T) => Maybe<Result<T>>;
export type Editable<T = $Var> = { update: Update<T> };

const withUpdate = <T>(update: Update<T>): Editable<T> => ({ update });
const constant = <T>(value: T) => () => value;

const withUpdatePrim = <T extends Prim>({ preset }: Preset<T>): Editable<T> =>
  withUpdate((action) => (v) => {
    const op = action(v);
    const { o = preset, n = preset } = op;
    return o === v ? just({ value: n as T, op }) : nothing();
  });

const editable: BehaviorDef<Editable, Eq & Preset> = {
  $string: withUpdatePrim,
  $number: withUpdatePrim,
  $boolean: withUpdatePrim,
  $array:
    ({ eq }) =>
    () =>
      withUpdate((updater) => (arrOld) => {
        const op = updater(arrOld);
        const { i: ins, d: del } = op;
        if (del.length === 0 && ins.length === 0)
          return just({ value: arrOld, op });
        const arrNew = [...arrOld];
        for (const { i: idx, a: arr } of del) {
          if (
            idx > arrNew.length ||
            idx < 0 ||
            !eq(arr)(arrNew.slice(idx, idx + arr.length))
          )
            return nothing();
          arrNew.splice(idx, arr.length);
        }
        for (const { i: idx, a: arr } of ins) {
          if (idx > arrNew.length || idx < 0) return nothing();
          arrNew.splice(idx, 0, ...arr);
        }
        return just({ value: arrNew, op });
      }),
  $dict:
    () =>
    ({ update, preset, eq }) =>
      withUpdate((action) => (dictOld) => {
        const op = action(dictOld);
        return reduceDict(
          op,
          (m, opVal, key) => {
            if (m.$ === 'Nothing' || !opVal || typeof key !== 'string')
              return m;
            const valOld = dictOld[key] ?? preset;
            const mResult = update(constant(opVal))(valOld);
            if (mResult.$ === 'Nothing') return nothing();
            const { value } = mResult.v;
            if (!eq(dictOld[key])(value)) {
              if (m.v.value === dictOld) {
                m.v.value = { ...dictOld };
              }
              if (eq(preset)(value)) {
                delete m.v.value[key];
              } else {
                m.v.value[key] = value;
              }
            }
            return m;
          },
          just({ value: dictOld, op })
        );
      }),
  $struct: <S extends object>() => (sttDoc: $Struct<Editable & Eq & Preset, S>) =>
    withUpdate((updater: Action<S>) => (sttOld: S): Maybe<Result<S>> => {
      const op = updater(sttOld);
      const opObj = op as ObjectOp<S>;
      return reduceStruct(
        sttOld,
        <K extends keyof S>(m: Maybe<Result<S>>, valOld: S[K], key: K) => {
          if (m.$ === 'Nothing' || !opObj[key]) return m;
          const mResult = sttDoc[key].update(constant(opObj[key]))(valOld);
          if (mResult.$ === 'Nothing') return nothing();
          const { value } = mResult.v;
          if (!sttDoc[key].eq(valOld)(value)) {
            if (m.v.value === sttOld) {
              m.v.value = { ...sttOld };
            }
            m.v.value[key] = value;
          }
          return m;
        },
        just({ value: sttOld, op })
      );
    }),
};

export default editable;
