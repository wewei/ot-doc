
/**
 * Array document
 * Given an ordered set S, we can define an array document model.
 * (As the set theory notations to express Array/List are not convenient to
 * use, I'll switch to Haskell notation instead)
 *    @8.1 T:
 *      data E s = Ins Integer s
 *               | Del Integer s
 *      type T s = [E s]
 *    @8.2 Inv:
 *      inv :: Order s => [E s] -> [E s]
 *      inv = fmap $ \case
 *                    Ins n s -> Del n s
 *                    Del n s -> Ins n s
 *    @8.3 Comp:
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
 *    @8.4 Tran:
 *      tran :: Order s => [E s] -> [E s] -> Maybe [E s]
 *      tran = liftTran tranElem where
 *        tranElem :: E s -> E s -> Maybe [E s]
 *        tranElem (Ins m x) (Ins n y)
 *          | m < n     = Ins m x
 *          | m > n     = Ins (m + 1) x
 *          | x < y     = Ins m x
 *          | otherwise = Ins (m + 1) x
 *        tranElem (Del m x) (Ins n y)
 *          | m < n     = Del m x
 *          | otherwise = Del (m + 1) x
 *        tranElem (Ins m x) (Del n y)
 *          | m <= n    = Ins m x
 *          | otherwise = Ins (m - 1) x
 *        tranElem (Del m x) (Del n y)
 *          | 
 */