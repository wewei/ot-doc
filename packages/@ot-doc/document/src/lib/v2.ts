export type UnaryOperator<T> = (a: T) => T;
export type PartialUnaryOperator<T> = (a: T) => T | undefined;
export type BinaryOperator<T> = (a: T) => UnaryOperator<T>;
export type PartialBinaryOperator<T> = (a: T) => PartialUnaryOperator<T>;
export type Predicate<T> = (a: T) => boolean;
export type Relation<T> = (a: T) => Predicate<T>;

/**
 * Before we define the Documents, we need to define a way to describe the
 * equivalence classes, say, the partitions. Ordinary type system provide
 * mechanisms to build "bigger" types from the primitive types. E.g. the union
 * types (A | B), product type ({ fst: A, snd: B }) or power types
 * { [K in string]: A }.
 * But there're no predefined way to define restricted * types. E.g. A complete
 * residue system modulo n { 0, 1, 2 ... n - 1 }, is a small subset of number.
 * When we proof the properties of document algorithms, one of the most 
 * important preconditions is making sure the document operations are strictly
 * conform to the restrictions.
 * For example, we can easily proved the consistency property of the document on
 * additive group of integers modulo n. But if we simply use the JavaScript
 * number type to represent the operations, when a value 1.5 is passed to the
 * compose/inverse algorithm, the behavior would be unexpected.
 * The way we define stricted types is to use the equivalence classes. We can
 * map each number to the representative of a equivalence class. E.g.
 * x => Math.floor(x) % n.
 * Then every valid number in JavaScript is representing a value in the additive
 * group of integers modulo n.
 */

/**
 * Eq defines an equivalence relation over given type T.
 * The relation is denoted by `equ` or `~` in math.  (~) is required to have the
 * following properties
 *    @1.1 Reflexivity: ∀ a ∈ T, a ~ a
 *    @1.2 Symmetry: ∀ a, b ∈ T, a ~ b ↔ b ~ a 
 *    @1.3 Transitivity: ∀ a, b, c ∈ T, a ~ b ∧ b ~ c → a ~ c 
 * Obviously
 *    @2 <T, (=)> is an equivalence relation for all set T
 */
export type Eq<T> = {
  equ: Relation<T>;
};


export const eq = <T>(equ: Relation<T>): Eq<T> => ({ equ });

/**
 * A document is defined over a set of operations T, with the following
 * structure
 *  - Identity operation as an element, denoted by `idn` or (ι) in math
 *  - Inverse as a unary operator, denoted by `inv` or (!) in math
 *  - Compose as a partial binary operator, denoted by `comp` or (*) in math
 *  - Transform as a partial binary operator, denoted by `tran` or (/) in math
 * With the following properties
 *    @4.1 [IdnP1] Identity Property 1
 *        ∀ a ∈ T
 *          → <ι, a>, <a, ι> ∈ Dom(*)
 *          ∧ ι * a = a
 *          ∧ a * ι = a
 *    @4.2 [IdnP2] Identity Property 2
 *        ∀ a ∈ T
 *          → <ι, a>, <a, ι> ∈ Dom(/)
 *          ∧ ι / a = ι
 *          ∧ a / ι = a
 *    @4.3 [InvP1] Inverse Property 1
 *        ∀ a ∈ T
 *          → <a, !a>, <!a, a> ∈ Dom(*)
 *          ∧ a * !a = ι
 *          ∧ !a * a = ι
 *    @4.4 [AsscP] Associative Property
 *        ∀ a, b, c ∈ T, <a, b>, <b, c> ∈ Dom(*)
 *          → <a * b, c>, <a, b * c> ∈ Dom(*)
 *          ∧ (a * b) * c = a * (b * c)
 *    @4.5 [CnvP1] Convergence Property 1
 *        ∀ a, b ∈ T, <a, b> ∈ Dom(/)
 *          → <b, a> ∈ Dom(/)
 *          ∧ <a, b / a>, <b, a / b> ∈ Dom (*)
 *          ∧ a * (b / a) = b * (a / b)
 * There are more properties, which are not required by COT (context-based
 * operational transformation) algorithms.
 *    @4.6 [InvP2] Inverse Property 2
 *        ∀ a, b ∈ T, <a, b> ∈ Dom(/)
 *          → <a / b, !b> ∈ Dom(/)
 *          ∧ a / b / !b = a
 *    The requirement for InvP2 is a little bit tricky. If our document model
 *    doesn't conform to InvP2, we must make sure all endpoints transform all
 *    operations one by one. No composed operations are used in transformation.
 *    Otherwise, the convergence would be broken.
 *    One of the commonly used document model, Greater Write Wins (Indeed, Last
 *    Write Wins, which is a special case of GWW, is the most used model) does
 *    not conform to InvP2. Fortunately, the COT algorithm don't transform
 *    composed operations. That means, GWW, LWW can be used with COT system.
 * 
 *    @4.7 [InvP3] Inverse Property 3
 *        ∀ a, b ∈ T, <a, b> ∈ Dom(/)
 *          → <b, a>, <!a, b / a> ∈ Dom(/)
 *          ∧ !a / (b / a) = !(a / b)
 *    @4.8 [CnvP2] Convergence Property 2
 *        ∀ a, b, c ∈ T, <a, b> ∈ Dom(/), <a, c> ∈ Dom(/)
 *          → <a / b, c / b>, <a / c, b / c>, <b, c>, <c, b> ∈ Dom(/)
 *          ∧ (a / b) / (c / b) = (a / c) / (b / c)
 */

export type Document<T> = Eq<T> & {
  idn: T;
  inv: UnaryOperator<T>;
  comp: PartialBinaryOperator<T>;
  tran: PartialBinaryOperator<T>;
};

/**
 * Greater Write Wins document
 * Given an ordered set S, we can define a greater-write-wins document model.
 * Where the operation set is
 *    @5.1 T:
 *      T := { ι } ∪ { (x, y) | x, y ∈ S, x ≠ y }
 *    @5.2 Inv:
 *      @5.2.1 !ι      := ι
 *      @5.2.2 !(x, y) := (y, x)
 *                      obviously, (x, y) ∈ T → x ≠ y → (y, x) ∈ T
 *    @5.3 Comp:
 *      @5.3.1 a * ι           := a
 *      @5.3.2 ι * a           := a
 *      @5.3.3 (x, y) * (y, x) := ι
 *      @5.3.4 (x, y) * (y, z) := (x, z)      ... (x ≠ z)
 *    @5.4 Tran:
 *      @5.4.1 ι / a           := ι
 *      @5.4.2 a / ι           := a
 *      @5.4.3 (x, y) * (x, z) := ι           ... (y ≤ z)
 *      @5.4.4 (x, y) * (x, z) := (z, y)      ... (y > z)
 * 
 * Prove:
 *    IdnP1 - Trivial, according to the defintion of `comp` @5.3
 *    IdnP2 - Trivial, according to the defintion of `tran` @5.4
 *    InvP1 -
 *      ι * !ι ={@5.3.2} !ι ={@5.2.1} ι
 *      !ι * ι ={@5.3.1} !ι ={@5.2.1} ι
 *      ∀ a, b ∈ S, a ≠ b
 *      (a, b) * !(a, b) ={@5.2.2} (a, b) * (b, a) ={5.3.3} = ι
 *    AsscP -
 *      ∀ a, b ∈ T
 *      (ι * a) * b ={@5.3.2} a * b ={@5.3.2} ι * (a * b)
 *      (a * ι) * b ={@5.3.1} a * b ={@5.3.2} a * (ι * b)
 *      (a * b) * ι ={@5.3.1} a * b ={@5.3.1} a * (b * ι)
 *      ∀ a, b, c ∈ { (x, y) | x, y ∈ S, x ≠ y }
 *      Because of <a, b>, <b, c> ∈ Dom(*), we can define
 *      a = (x, y), b = (y, z), c = (z, w) where
 *      x, y, z ∈ S, and x ≠ y, y ≠ z, z ≠ w
 *      Then
 *        (a * b) * c
 *      = ((x, y) * (y, z)) * (z, w)            ... @5.3.3, @5.3.4
 *      = (x = z ? ι : (x, z)) * (z, w)
 *      = x = z ? ι * (z, w) : (x, z) * (z, w)  ... @5.3.2
 *      = x = z ? (z, w) : (x, z) * (z, w)      ... @5.3.3, @5.3.4
 *      = x = z ? (z, w) : x = w ? ι : (x, w)
 *      = x = z ? (x, w) : x = w ? ι : (x, w)   ... z ≠ w
 *      = x = w ? ι : (x, w)
 *        a * (b * c)
 *      = (x, y) * ((y, z) * (z, w))            ... @5.3.3, @5.3.4
 *      = (x, y) * (y = w ? ι : (y, w))
 *      = y = w ? (x, y) * ι : (x, y) * (y, w)  ... @5.3.2
 *      = y = w ? (x, y) : (x, y) * (y, w)      ... @5.3.3, @5.3.4
 *      = y = w ? (x, y) : x = w ? ι : (x, w)
 *      = y = w ? (x, w) : x = w ? ι : (x, w)   ... x ≠ y
 *      = x = w ? ι : (x, w)
 *      = (a * b) * c
 *    CnvP1 -
 *      ∀ a ∈ T
 *      a * (ι / a) ={@4.2} a * ι ={@4.1} a
 *      ι * (a / ι) ={@4.2} ι * a ={@4.1} a
 *      Note. This part is independent from the document model, the proof only
 *      depends on the document properties (IdnP1 & IdnP2). For other document
 *      models, we only need to prove CnvP1 for 2 none ι operations.
 *      ∀ a, b ∈ { (x, y) | x, y ∈ S, x ≠ y }
 *      Because of <a, b> ∈ Dom(/), we can define
 *      a = (x, y), b = (x, z) where
 *      x, y, z ∈ S, x ≠ y, x ≠ z
 *        a * (b / a)
 *      = (x, y) * ((x, z) / (x, y))            ... @5.4.3, 5.4.4
 *      = (x, y) * (z > y ? (y, z) : ι)
 *      = z > y ? (x, y) * (y, z) : (x, y) * ι  ... @5.3.1
 *      = z > y ? (x, y) * (y, z) : (x, y)      ... x ≠ z, @5.3.4
 *      = z > y ? (x, z) : (x, y)
 *      = (x, max(z, y))
 *        b * (a / b)
 *      = (x, z) * ((x, y) / (x, z))            ... @5.4.3, 5.4.4
 *      = (x, z) * (y > z ? (z, y) : ι)
 *      = y > z ? (x, z) * (z, y) : (x, z) * ι  ... @5.3.1
 *      = y > z ? (x, z) * (z, y) : (x, z)      ... x ≠ y, @5.3.4
 *      = y > z ? (x, y) : (x, z)
 *      = (x, max(y, z))
 *      = a * (b / a)
 * Note, InvP2 doesn't hold for GWW document, counterexample:
 *        (1, 2) / (1, 3) / (3, 1)
 *      = ι / (3, 1)
 *      = ι
 *      ≠ (1, 2)
 *      
 */
export type Ordered<S> = Eq<S> & {
  lt: Relation<S>;
};

export const ordered = <S>(
  lt: Relation<S>,
  equ: Relation<S> = (a) => (b) => !lt(a)(b) && !lt(b)(a)
): Ordered<S> => ({
  lt,
  equ,
});

export type Pair<S> = [S, S];
export type Gww<S> = Pair<S> | null;

export const gwwDocument = <S>({ lt, equ }: Ordered<S>): Document<Gww<S>> => {
  const rep: UnaryOperator<Gww<S>> = (a) =>
    a === null || a[0] === a[1] ? null : a;
  return {
    idn: null,
    inv: (a) => (a ? (([x, y]) => [y, x])(a) : null),
    comp: (a) => (b) => {
      if (a && b) {
        const [x, y] = a;
        const [z, w] = b;
        if (equ(y)(z)) {
          return equ(x)(w) ? null : [x, w];
        }
        return undefined;
      }
      return a ? a : b;
    },
    tran: (a) => (b) => {
      if (a && b) {
        const [x, y] = a;
        const [z, w] = b;
        if (equ(x)(z)) {
          return lt(w)(y) ? [w, y] : null;
        }
        return undefined;
      }
      return a;
    },
    equ: (a) => (b) => {
      if (a === b) {
        return true;
      }
      const repA = rep(a);
      const repB = rep(b);
      if (repA && repB) {
        const [x, y] = repA;
        const [z, w] = repB;
        return equ(x)(z) && equ(y)(w);
      }
      return repA === repB;
    },
  };
};

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
  const rep: UnaryOperator<Record<string, U>> = (rec) => Object.entries(rec).reduce((m, [key, u]) => {
    if (equ(idn)(u)) {
      if (m === rec) {
        // Copy on write
        m = { ...rec };
      }
      delete m[key];
    }
    return m;
  } , rec);
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

/**
 * Product document
 */