import { $Var } from "./hkt";
import { BehaviorDef } from "./behavior";
import { Preset } from "./preset";

export type Relation<T> = (a: T) => (b: T) => boolean;
export type Eq<T = $Var> = { eq: Relation<T> };

const constant = <T>(value: T) => () => value;

const withEq = <T>(f: Relation<T> = () => () => false): Eq<T> => ({
  eq: (a) => (b) => a === b || f(a)(b),
});

export const eq: BehaviorDef<Eq, Preset> = {
  $string: constant(withEq()),
  $number: constant(withEq()),
  $boolean: constant(withEq()),
  $array: constant(({ eq }) =>
    withEq((a) => (b) => {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i += 1) if (!eq(a[i])(b[i])) return false;
      return true;
    })
  ),
  $dict: constant(({ eq, preset }) =>
    withEq((a) => (b) => {
      for (const key in a) if (!eq(a[key])(b[key] ?? preset)) return false;
      for (const key in b) if (!(key in a) && !eq(preset)(b[key])) return false;
      return true;
    })
  ),
  $struct: constant((stt) =>
    withEq((a) => (b) => {
      for (const key in stt) if (!stt[key].eq(a[key])(b[key])) return false;
      return true;
    })
  ),
};
