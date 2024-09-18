import { $Eq, $Ord } from "./algebra";
import { $FullDoc, $Init } from "./document";
import { $fullDocGww, Update } from "./singleton";

// t: timestamp
// v: value
export type Timestamped<T> = { t: number, v: T };

export const $eqTimestamped = <T>({ equals }: $Eq<T>): $Eq<Timestamped<T>> => ({
  equals: (a) => (b) => a.t === b.t && equals(a.v)(b.v),
});

export const $ordTimestamped = <T>({ lessThan }: $Ord<T>): $Ord<Timestamped<T>> => ({
  lessThan: (a) => (b) => a.t < b.t || (a.t === b.t && lessThan(a.v)(b.v)),
});

export const $fullDocLww = <A>(
  cls: $Eq<A> & $Init<A> & $Ord<A>
): $FullDoc<Timestamped<A>, Update<Timestamped<A>>> => {
  const v = cls.initial();
  const initial = () => ({ t: -Infinity, v });
  const { equals } = $eqTimestamped(cls);
  const { lessThan } = $ordTimestamped(cls);
  return $fullDocGww({ equals, lessThan, initial });
};
