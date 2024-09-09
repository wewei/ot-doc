
/**
 * Array document
 * Given an ordered set S, we can define an array document model.
 * (As the set theory notations to express Array/List are not convenient to
 * use, I'll switch to Haskell notation instead)
 *    @8.1 T:
 *      data E s = Ins Integer s
 *               | Del Integer s
 *      type T s = [E s]
 *    @8.2 Idn:
 *      idn :: [E s]
 *      idn = []
 *    @8.3 Inv:
 *      inv :: Order s => [E s] -> [E s]
 *      inv = inverse . (
 *              fmap $ \case
 *                Ins n s -> Del n s
 *                Del n s -> Ins n s)
 *    @8.4 Comp:
 *      comp :: Order s => [E s] -> [E s] -> Maybe [E s]
 *      comp xs ys = combine (inverse xs) ys where
 *        combine [] ys         = Just ys
 *        combine xs []         = Just (inverse xs)
 *        combine (x:xs) (y:ys) =
 *          case (x, y) of
 *            (Ins m u) (Del n v) -> if m == n
 *                                    then if u == v then comp xs ys
 *                                                   else Nothing
 *                                    else combine xs (x:y:ys)
 *            (Del m u) (Ins n v) -> if m == n
 *                                    then if u == v then comp xs ys
 *                                                   else Nothing
 *                                    else combine xs (x:y:ys)
 *            otherwise           -> combine xs (x:y:ys)
 *    @8.5 Tran:
 *      tran :: Order s => [E s] -> [E s] -> Maybe [E s]
 *      tran = liftTran tranElem where
 *        tranElem :: E s -> E s -> Maybe [E s]
 *        tranElem (Ins m x) (Ins n y)
 *          | m < n     = Just [Ins m x]
 *          | m > n     = Just [Ins (m + 1) x]
 *          | x < y     = Just [Ins m x)
 *          | otherwise = Just ]Ins (m + 1) x]
 *        tranElem (Del m x) (Ins n y)
 *          | m < n     = Just [Del m x]
 *          | otherwise = Just [Del (m + 1) x]
 *        tranElem (Ins m x) (Del n y)
 *          | m <= n    = Just [Ins m x]
 *          | otherwise = Just [Ins (m - 1) x]
 *        tranElem (Del m x) (Del n y)
 *          | m < n     = Just [Del m x]
 *          | m > n     = Just [Del (m - 1) x]
 *          | x == y    = Just []
 *          | otherwise = Nothing
 */

import { Ordered, PartialBinaryOperator } from "./algebra";
import { DocumentMeta } from "./document-meta";

export type Oplet<T> = {
  typ: 'ins' | 'del',
  idx: number,
  val: T,
};

type List<T> = {
  val: T,
  nxt: List<T>;
} | null;

export const arrayDocument = <T>({ lt, equ }: Ordered<T>): DocumentMeta<Oplet<T>[]>  => {
  const rep = (a: Oplet<T>[]): Oplet<T>[] | undefined => a; // TODO
  const liftTran = (tranElem: (eA: Oplet<T>) => (eB: Oplet<T>) => List<Oplet<T>> | undefined): PartialBinaryOperator<List<Oplet<T>>> => {
    const tran: PartialBinaryOperator<List<Oplet<T>>> = (a) => (b) => {
      if (a === null) return null;
      if (b === null) return a;

    };
    return tran;
  };

  return {
    idn: [],
    inv: (a) =>
      a
        .map(({ typ, idx, val }): Oplet<T> => ({
          typ: typ === 'ins' ? 'del' : 'ins',
          idx,
          val,
        }))
        .reverse(),
    comp: (a) => (b) => rep([...a, ...b]),
    tran: (a) => (b) => a, // TODO
    equ: (a) => (b) => {
      if (a === b) return true;
      const rA = rep(a);
      const rB = rep(b);
      if (!rA || !rB) return false;
      if (rA.length !== rB.length) return false;
      for (let i = 0; i < rA.length; i += 1) {
        const eA = rA[i];
        const eB = rB[i];
        if (eA.typ !== eB.typ || eA.idx !== eB.idx || !equ(eA.val)(eB.val)) {
          return false;
        }
      }
      return true;
    },
  };
};