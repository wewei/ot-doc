import { PartialBinaryOperator, UnaryOperator } from './algebra';
import { Document } from './document-core';

/**
 * Power document
 * Given a document on operation set U and a key set K, we can define document
 * over the power set U ^ K (or K -> U).
 *    @6.1 T:
 *      T := U ^ K
 *    @6.2 Idn:
 *      ι := _ -> ι[U]
 *    @6.3 Inv:
 *      !f := k -> ![U] f(k)
 *    @6.4 Comp:
 *      f * g := k -> f(k) *[U] g(k)
 *      Dom(*) = { <f, g> | ∀ k ∈ K, <f(k), g(k)> ∈ Dom<*[U]> }
 *    @6.5 Tran:
 *      f / g := k -> f(k) /[U] g(k)
 *      Dom(/) = { <f, g> | ∀ k ∈ K, <f(k), g(k)> ∈ Dom</[U]> }
 *  Prove:
 *    IdnP1 -
 *      ∀ f ∈ T
 *      ι * f ={@6.4} k -> ι(k) *[U] f(k)
 *            ={@6.2} k -> ι[U] *[U] f(k)
 *            ={@4.1} k -> f(k)
 *            ={η}    f
 *      f * ι ={@6.4} k -> f(k) *[U] ι(k)
 *            ={@6.2} k -> f(k) *[U] ι[U]
 *            ={@4.1} k -> f(k)
 *            ={η}    f
 *    IdnP2 -
 *      ∀ f ∈ T
 *      ι / f ={@6.5} k -> ι(k) /[U] f(k)
 *            ={@6.2} k -> ι[U] /[U] f(k)
 *            ={@4.2} k -> ι[U]
 *            ={α}    _ -> ι[U]
 *            ={@6.2} ι
 *      f / ι ={@6.5} k -> f(k) /[U] ι(k)
 *            ={@6.2} k -> f(k) /[U] ι[U]
 *            ={@4.2} k -> f(k)
 *            ={η}    f
 *    InvP1 -
 *      ∀ f ∈ T
 *      f * !f  ={@6.4} k -> f(k) *[U] (!f)(k)
 *              ={@6.3} k -> f(k) *[U] ![U]f(k)
 *              ={@4.3} k -> ι[U]
 *              ={α}    _ -> ι[U]
 *              ={@6.2} ι
 *      !f * f  ={@6.4} k -> (!f)(k) *[U] f(k)
 *              ={@6.3} k -> ![U]f(k) *[U] f(k)
 *              ={@4.3} k -> ι[U]
 *              ={α}    _ -> ι[U]
 *              ={@6.2} ι
 *    AsscP -
 *      ∀ f, g, h ∈ T, <f, g>, <g, h> ∈ Dom(*)
 *        (f * g) * h                     ... @6.4
 *      = (k -> f(k) *[U] g(k)) * h       ... @6.4, β
 *      = k -> (f(k) *[U] g(k)) *[U] h(k) ... @4.4
 *      = k -> f(k) *[U] (g(k) *[U] h(k)) ... @6.4
 *      = f * (k -> g(k) *[U] h(k))       ... @6.4
 *      = f * (g * h)
 *    ConvP1 -
 *      ∀ f, g ∈ T, <f, g> ∈ Dom(/)
 *        g * (f / g)
 *      = k -> g(k) *[U] (f / g)(k)       ... @6.4
 *      = k -> g(k) *[U] (f[k] /[U] g(k)) ... @6.5, β
 *      = k -> f(k) *[U] (g[k] /[U] f(k)) ... @4.5
 *      = f * (k -> g[k] /[U] f(k))       ... @6.4
 *      = f * (g / f)                     ... @6.5
 *
 * Record document
 * In practical, it's hard to define a serializable power document.
 *    > It requires a serializable pure function language. We may use a dialect
 *    > of Lisp, but due to the undecidability of The Halting Problem, this is
 *    > not a secure solution. One endpoint would easily post an unterminatable
 *    > operation and kill all the collaborating endpoints.
 * A more practical document model is the Record document, which is a restricted
 * power document, with K being the string type, and return none-ι[U] operations
 * on a finite subset of K.
 */

export const recordDocument = <U>({
  idn,
  inv,
  equ,
  comp,
  tran,
}: Document<U>): Document<Record<string, U>> => {
  const rep: UnaryOperator<Record<string, U>> = (rec) =>
    Object.entries(rec).reduce((m, [key, u]) => {
      if (equ(idn)(u)) {
        if (m === rec) {
          // Copy on write
          m = { ...rec };
        }
        delete m[key];
      }
      return m;
    }, rec);
  // Lift a UnaryOperator<U> to UnaryOperator<Record<string, U>>
  // This is indeed mapping values in objects
  const liftUo =
    (uo: UnaryOperator<U>): UnaryOperator<Record<string, U>> =>
    (rec) =>
      Object.entries(rec).reduce((m, [key, u]) => {
        m[key] = uo(u);
        return m;
      }, {} as Record<string, U>);

  // Lift a PartialBinaryOperator<U> to PartialBinaryOperator<Record<string, U>>
  // It assumes the pbo (denoted by (.)) has the right identity property
  //    ∀ a ∈ U, a . ι = a
  // Both (*) and (/) has this property (@4.1, @4.2)
  const liftPbo =
    (pbo: PartialBinaryOperator<U>): PartialBinaryOperator<Record<string, U>> =>
    (recA) =>
    (recB) =>
      Object.entries(recB).reduce(
        (m, [key, u]) => {
          if (m) {
            const value = pbo(m[key] ?? idn)(u);
            if (value === undefined) {
              return undefined;
            }
            if (equ(idn)(value)) {
              delete m[key];
            } else {
              m[key] = value;
            }
          }
          return m;
        },
        { ...recA } as Record<string, U> | undefined
      );
  return {
    idn: {},
    inv: liftUo(inv),
    comp: liftPbo(comp),
    tran: liftPbo(tran),
    equ: (a) => (b) => {
      if (a === b) {
        return true;
      }
      const repA = rep(a);
      const repB = rep(b);
      if (Object.keys(repA).length !== Object.keys(repB).length) {
        return false;
      }
      for (const key in repA) {
        const uA = repA[key] ?? null;
        const uB = repB[key] ?? null;
        if (uA === null || uB === null || !equ(uA)(uB)) {
          return false;
        }
      }
      return true;
    },
  };
};
