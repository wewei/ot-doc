// $: Constructor type
// v: the value
const symCtor = Symbol();
export type Nothing = { [symCtor]: 'N' };
export type Just<T> = { [symCtor]: 'J', v: T };
export type Maybe<T> = Nothing | Just<T>;

export const { nothing, just, isNothing, isJust } = (() => {
  const NOTHING: Nothing = { [symCtor]: 'N' };
  const nothing = <T>(): Maybe<T> => NOTHING;
  const just = <T>(v: T): Maybe<T> => ({ [symCtor]: 'J', v });
  const isNothing = <T>(m: Maybe<T>): m is Nothing => m === NOTHING;
  const isJust = <T>(m: Maybe<T>): m is Just<T> => m[symCtor] === 'J';
  return { nothing, just, isNothing, isJust };
})();
