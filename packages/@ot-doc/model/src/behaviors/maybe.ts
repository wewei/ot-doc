// $: Constructor type
// v: the value
export type Nothing = { $: 'N' };
export type Just<T> = { $: 'J', v: T };
export type Maybe<T> = Nothing | Just<T>;

export const nothing = <T>(): Maybe<T> => ({ $: 'N' });
export const just = <T>(v: T): Maybe<T> => ({ $: 'J', v });
export const isNothing = <T>(m: Maybe<T>): m is Nothing => m.$ === 'N';
export const isJust = <T>(m: Maybe<T>): m is Just<T> => m.$ === 'J';


