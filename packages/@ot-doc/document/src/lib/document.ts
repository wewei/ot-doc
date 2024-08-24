import { identity, mapValues } from "lodash";

// Partial Binary Operator
export type PartialBinaryOperator<G> = (a: G, b: G) => G | undefined;
export type BinaryOperator<G> = (a: G, b: G) => G;
export type UnaryOperator<G> = (a: G) => G;
export type Comparator<G> = (a: G, b: G) => boolean;

// A complete document model is an algebric groupoid plus a transform operator.
// A groupoid is consists of
//    * A set G
//    * A unary operator, inverse (~)
//    * A partial binary operator compose (*)
//
// The Transform is
//    * A paritial binary operator transform (/)
//
// Notation: DocumentModel => <G, ~, *, />
//                         where
//                            ~ ∈     G  -> G
//                            * ∈ <G, G> ~> G
//                            / ∈ <G, G> ~> G
//
// The following rules are required:
// AP : ∀ a, b, c ∈ G → (a * b) * c = a * (b * c)
// IP1: ∀ a, b ∈ G ∧ <a, b> ∈ dom(*) → a * b * ~b = a ∧ ~a * a * b = b
// CP1: ∀ a, b ∈ G ∧ <a, b> ∈ dom(/) →
//      <a, b / a>, <b, a / b> ∈ dom(*) ∧ a * (b / a) = b * (a / b)
//
// The following rules are optional:
// IP2: ∀ a, b ∈ G → a / b / ~b = a
// CP2: ∀ a, b, c ∈ G → (a / b) / (c / b) = (a / c) / (b / c)
//
// Models conforming to IP2 & CP2 can be used in decentralized OT systems
//
// In practical, we use `undefined` in JavaScript to explicitly represent the
// result of a * b where <a, b> ∉ dom(*), or a / b where <a, b> ∉ dom(/)
export type Groupoid<G> = {
  // Given 1 operation a, return the inverse operation
  inverse: UnaryOperator<G>;

  // Given 2 consequent operations: a, b, return the composition of the 2
  // operators c. Note, the compose operator is a partial operation, it's not
  // neccessary for all <a, b> ∈ <G, G> to have a composition.
  // Notation: a * b = c
  compose: PartialBinaryOperator<G>;
};

export type DocumentModel<G> = Groupoid<G> & {
  // Given 2 operations based on the same state: a, b, return the inclusive
  // transformation result of a, say a', where a' applies on the state after b,
  // with the same effect as a, considering the impact of b.
  // Notation: a / b = a'
  transform: PartialBinaryOperator<G>;
};

// An algebric group consists of
//    * A set G
//    * An identity element 1
//    * A unary operator, inverse (~)
//    * A binary operator compose (*)
// Notation: GroupModel<G> => <G, 1, ~, *>
//                         where
//                            1 ∈           G
//                            ~ ∈     G  -> G
//                            * ∈ <G, G> -> G
// The following rules are required
// AP : ∀ a, b, c ∈ G → (a * b) * c = a * (b * c)
// IDP: ∀ a ∈ G → a * 1 = 1 * a = a
// IP : ∀ a ∈ G → a * ~a = ~a * a = 1
//
// If the (*) also conforms to the communtative rule, it's an abelian group
// COP: ∀ a, b ∈ G → a * b = b * a
export type GroupModel<G> = {
  identity: G;
  inverse: UnaryOperator<G>;
  compose: BinaryOperator<G>;
};

// All abelian groups are already groupoid, we use <x, _> -> x as transform to
// get a document model. This model conforms to IP2 & CP2.
// Prove:
//  Document AP  <- Group AP
//  Document IP1:
//    ∀ a, b ∈ G.
//      a * b * ~b = a * 1 = a
//      a * ~a * b = 1 * b = b
//  Document CP1
//    ∀ a, b ∈ G.
//      a * (b / a) = a * b = b * a = b * (a / b)
//  Document IP2:
//    ∀ a, b ∈ G.
//      a / b / ~b = a / b = a
//  Document CP2:
//    ∀ a, b, c ∈ G.
//      (a / b) / (c / b) = a = (a / c) / (b / c)
export const abelianDocument = <G>({
  inverse,
  compose,
}: GroupModel<G>): DocumentModel<G> => ({
  inverse,
  compose,
  transform: identity,
});

// Typical abelian group documents
export const sumOfNumberGroup = (digits: number): GroupModel<number> => ({
  identity: 0,
  inverse: (x) => Number((-x).toFixed(digits)),
  compose: (x, y) => Number((x + y).toFixed(digits)),
});

export const sumOfNumber = (digits: number) =>
  abelianDocument(sumOfNumberGroup(digits));

// Pair groupoid over a total ordered set infers a Greatest Write Win document,
// where
//    <m, x> / <m, y> = <y, max(x, y)>
//    dom(*) = <<x, m>, <m, y>>
//    dom(/) = <<m, x>, <m, y>>
//
// Prove
//  AP and IP1 are already implied by the definition of the pair groupoid
//  Document CP1:
//    ∀ a, b ∈ G ∧ <a, b> ∈ dom(/)
//    let
//      <m, x> = a
//      <m, y> = b
//      a * (b / a) = <m, x> * (<m, y> / <m, x>)
//                  = <m, x> * <x, max(y, x)>
//                  = <m, max(y, x)>
//                  = <m, max(x, y)>
//      b * (a / b) = <m, y> * (<m, x> / <m, y>)
//                  = <m, y> * <y, max(x, y)>
//                  = <m, max(x, y)>
//                  = a * (b / a)
export type EqModel<S> = {
  equals: (a: S, b: S) => boolean;
};

export type OrderedModel<S> = {
  lessThan: (a: S, b: S) => boolean;
};

export const eqFromOrdered = <S>({
  lessThan,
}: OrderedModel<S>): EqModel<S> => ({
  equals: (a, b) => !lessThan(a, b) && !lessThan(b, a),
});

export type Gww<S> = [S, S];

export const pairGroupoid = <S>({ equals }: EqModel<S>): Groupoid<Gww<S>> => ({
  inverse: ([from, to]) => [to, from],
  compose: ([fromA, toA], [fromB, toB]) =>
    equals(toA, fromB) ? [fromA, toB] : undefined,
});

export type GwwDocument<S> = DocumentModel<Gww<S>>;

export const gwwDocument = <S>(
  { lessThan }: OrderedModel<S>,
  { equals }: EqModel<S> = eqFromOrdered({ lessThan })
): GwwDocument<S> => {
  const { inverse, compose } = pairGroupoid({ equals });
  return {
    inverse,
    compose,
    transform: ([fromA, toA], [fromB, toB]) =>
      equals(fromA, fromB) ? [toB, lessThan(toB, toA) ? toA : toB] : undefined,
  };
};

// Based on the GWW document, we can also define a Last Write Win document.
// The key point is to pair a timestamp to the value, and always compare the
// timestamp first
export type Timestamped<S> = [number, S];
export type Lww<S> = Gww<Timestamped<S>>;
export type LwwDocument<S> = DocumentModel<Lww<S>>;

export const lwwDocument = <S>(
  { lessThan }: OrderedModel<S>,
  { equals }: EqModel<S> = eqFromOrdered({ lessThan })
): LwwDocument<S> =>
  gwwDocument(
    { lessThan: ([tA, vA], [tB, vB]) => tA < tB || (tA === tB && vA < vB) },
    { equals: ([tA, vA], [tB, vB]) => tA === tB && equals(vA, vB) }
  );

export const primitiveEq = {
  equals: <P>(a: P, b: P) => a === b,
};

export const primitiveOrder = {
  lessThan: <P>(a: P, b: P) => a < b,
};

// Typical GWW documents
const gwwPrimitive = gwwDocument(primitiveOrder, primitiveEq);
export const gwwNumber = gwwPrimitive as GwwDocument<number>;
export const gwwString = gwwPrimitive as GwwDocument<string>;
export const gwwBoolean = gwwPrimitive as GwwDocument<boolean>;

// Typical LWW documents
const lwwPrimitive = lwwDocument(primitiveOrder, primitiveEq);
export const lwwNumber = lwwPrimitive as LwwDocument<number>;
export const lwwString = lwwPrimitive as LwwDocument<string>;
export const lwwBoolean = lwwPrimitive as LwwDocument<boolean>;

// Given a document <G, ~, *, /> and an element ι ∉ G, we can define an optional
// document over the G ∪ { ι }
//    ~ι    = ι
//    ~x    = ~[G]x (x ∈ G)
//    x * ι = ι * x = x
//    x * y = x *[G] y (x, y ∈ G)
//    x / ι = x
//    ι / x = ι
//    x / y = x /[G] y (x, y ∈ G)
// Prove:
//  Document AP:
//    ∀ a, b, c ∈ G.
//    obviousely, (a * b) * c = a * (b * c)
//    ∀ a, b ∈ G ∪ {ι}.
//    (a * b) * ι = a * b = a * (b * ι)
//    (a * ι) * b = a * b = a * (ι * b)
//    (ι * a) * b = a * b = ι * (a * b)
//  Document IP1:
//    ∀ a, b ∈ G.
//    obviousely, a * b * ~b = a, a * ~a * b = b
//    ∀ a ∈ G ∪ {ι}.
//    a * ι * ~ι = a * ι * ι = a
//    ι * ~ι * a = ι * ι * a = a
//  Document CP1:
//    ∀ a, b ∈ G.
//    obviousely, a * (b / a) = b * (a / b)
//    ∀ a ∈ G ∪ {ι}.
//    a * (ι / a) = a * ι = a
//    ι * (a / ι) = ι * a = a
//
// In practical, we can use `null` in JavaScript to represent ι
// Note, we need to make sure whenever we use the `optionalDocument` over a
// type G, make sure `null` is not included in that type.
// BTW, applying `optionalDocument` multiple times isn't a problem, because
// the behavior of `null` is consistant. But if G contains `null`, and the
// behavior of `inverse`, `compose`, `transform` over `null` is different from
// thosed defined in the previous construction, the `optionalDocument(...)` may
// not be a wellformed document.
export const optionalDocument = <G>({
  inverse,
  compose,
  transform,
}: DocumentModel<G>): DocumentModel<G | null> => ({
  inverse: (a) => (a === null ? null : inverse(a)),
  compose: (a, b) => (a === null ? b : b === null ? a : compose(a, b)),
  transform: (a, b) => (a === null ? null : b === null ? a : transform(a, b)),
});

const liftPbo =
  <G extends Record<string, unknown>>(
    getFunc: (key: keyof G) => PartialBinaryOperator<G[typeof key]>
  ): PartialBinaryOperator<G> =>
  (a, b) =>
    Object.keys(b).reduce(
      (c, k: keyof G) => {
        if (c) {
          if (k in c) {
            const v = getFunc(k)(c[k], b[k]);
            if (v === undefined) {
              return undefined;
            } else {
              c[k] = v;
            }
          }
        }
        return c;
      },
      { ...a } as G | undefined
    );

// Given a document <G, ~, *, /> and a set S, we can define a power document
// over set G ^ S. where
//    ~x    = { <e,       ~x(e)> | e ∈ S }
//    x * y = { <e, x(e) * y(e)> | e ∈ S }
//    x / y = { <e, x(e) / y(e)> | e ∈ S }
// Prove:
//  Document AP:
//    ∀ a, b, c ∈ G.
//    (a * b) * c = { <e, a(e) * b(e)> | e ∈ S } * c
//                = { <e, (a(e) * b(e)) * c(e) | e ∈ S }
//                = { <e, a(e) * (b(e) * c(e)) | e ∈ S }
//                = a * { <e, b(e) * c(e)> | e ∈ S }
//                = a * (b * c)
//  Document IP1:
//    ∀ a, b ∈ G.
//      a * b * ~b = { <e, a(e) * b(e)> | e ∈ S } * { <e, ~b(e)> | e ∈ S }
//                 = { <e, a(e) * b(e) * ~b(e)> | e ∈ S }
//                 = { <e, a(e)> | e ∈ S }
//                 = a
//      a * ~a * b = { <e, a(e)> | e ∈ S } * { <e, ~a(e)> | e ∈ S } * b
//                 = { <e, a(e) * ~a(e)> | e ∈ S } * { <e, b(e)> | e ∈ S }
//                 = { <e, a(e) * ~a(e) * b(e)> | e ∈ S }
//                 = { <e, b(e)> | e ∈ S }
//                 = b
//  Document CP1
//    ∀ a, b ∈ G.
//      a * (b / a) = { <e, a(e) * (b(e) / a(e))> | e ∈ S }
//                  = { <e, b(e) * (a(e) / b(e))> | e ∈ S }
//                  = b * (a / b)
//
// In practical, we use a special power document, where S is always string,
// then we can represent (G ∪ { ι }) ^ S with a Record<string, G>.
// In this implementation, for all key not defined in the record, we assume
// they're mapped to ι.

const recordLift = <G>(
  f: PartialBinaryOperator<G>
): PartialBinaryOperator<Record<string, G>> => liftPbo(() => f);

export const recordDocument = <G>({
  inverse,
  compose,
  transform,
}: DocumentModel<G>): DocumentModel<Record<string, G>> => ({
  inverse: (a) => mapValues(a, inverse),
  compose: recordLift(compose),
  transform: recordLift(transform),
});

// Given 2 documents <G, ~[G], *[G], /[G]>, <H, ~[H], *[H], /[H]>, we can define
// a product document over set <G, H>, where
//    ~<x, y>         = <   ~[G]x,    ~[H]y>
//    <x, y> * <z, w> = <x *[G] z, y *[H] w>
//    <x, y> / <z, w> = <x /[G] z, y /[H] w>
//
// Prove:
//  Document AP:
//    ∀ ax, bx, cx ∈ G, ay, by, cy ∈ H.
//      (<ax, ay> * <bx, by>) * <cx, cy>
//    = <ax *[G] bx, ay *[H] by> * <cx, cy>
//    = <(ax *[G] bx) *[G] cx, (ay *[H] by) *[H] cy>
//    = <ax *[G] (bx *[G] cx), ay *[H] (by *[H] cy)>
//    = <ax, ay> * <bx *[G] cx, by *[H] cy>
//    = <ax, ay> * (<bx, by> * <cx, cy>)
//  Document IP1:
//    ∀ ax, bx ∈ G, ay, by ∈ H.
//      <ax, ay> * <bx, by> * ~<bx, by>
//    = <ax *[G] bx *[G] ~bx, ay *[H] by *[H] ~by>
//    = <ax, ay>
//      <ax, ay> * ~<ax, ay> * <bx, by>
//    = <ax *[G] ~ax *[G] bx, ay *[H] ~ay *[H] by>
//    = <bx, by>
//  Document CP1:
//    ∀ ax, bx ∈ G, ay, by ∈ H.
//      <ax, ay> * (<bx, by> / <ax, ay>)
//    = <ax, ay> * <bx /[G] ax, by /[H] ay>
//    = <ax *[G] (bx /[G] ax), ay *[H] (by /[H] ay)>
//    = <bx *[G] (ax /[G] bx), by *[H] (ay /[H] by)>
//    = <bx, by> * <ax /[G] bx, ay /[H] by>
//    = <bx, by> * (<ax, ay> / <bx, by>)
//
// In practical, we use tuples to implement product documents. We can use
// Partial<{ [K0]: V0, [K1]: V1 ... }> to present the product set
// <V0 ∪ { ι }, V1 ∪ { ι }, ...>. In the following implementation, an undefined
// parameters in the partial struct type are mapped to ι.

type DocumentTuple<G extends Record<string, unknown>> = {
  [K in keyof G]: DocumentModel<G[K]>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDocumentTuple = DocumentTuple<Record<string, any>>;
type OpOfDocumentTuple<Tp> = Partial<{
  [K in keyof Tp]: Tp[K] extends DocumentModel<infer V> ? V : never;
}>;
type DocumentModelFromTuple<Tp> = DocumentModel<OpOfDocumentTuple<Tp>>;

const tupleLift = <Tp extends AnyDocumentTuple>(
  documentTuple: Tp,
  method: 'compose' | 'transform'
): PartialBinaryOperator<OpOfDocumentTuple<Tp>> =>
  liftPbo((k) => documentTuple[k][method]);

export const tupleDocument = <Tp extends AnyDocumentTuple>(
  documentTuple: Tp
): DocumentModelFromTuple<Tp> => ({
  inverse: (a) => mapValues(a, (v, k) => documentTuple[k].inverse(v)),
  compose: tupleLift(documentTuple, 'compose'),
  transform: tupleLift(documentTuple, 'transform'),
});

// Helper functions to generate document updaters
export type Updater<T> = (value: T) => T;

export const updateTimestamped =
  (timestamp: number) =>
  <T>(update: Updater<T>): Updater<Timestamped<T>> =>
  ([, value]) =>
    [timestamp, update(value)];

export const updateGww =
  <T>(value: T): Updater<Gww<T>> =>
  ([, to]) =>
    [to, value];

export const updateLww =
  (timestamp: number) =>
  <T>(value: T): Updater<Gww<Timestamped<T>>> =>
    updateGww([timestamp, value]);

export const updateRecord =
  <T>(defaultValue: T, isDefault = (v: T) => v === defaultValue) =>
  (updaters: Record<string, Updater<T>>): Updater<Record<string, T>> =>
  (input) =>
    Object.entries(updaters).reduce(
      (output, [k, updater]) => {
        const v = updater(k in output ? output[k] : defaultValue);
        if (isDefault(v)) {
          delete output[k];
        } else {
          output[k] = v;
        }
        return output;
      },
      { ...input }
    );

export const updateTuple =
  <T>(
    defaultTuple: T,
    isDefault: Partial<{ [K in keyof T]: (v: T[K]) => boolean }> = {}
  ) =>
  (
    updaterTuple: Partial<{ [K in keyof T]: Updater<T[K]> }>
  ): Updater<Partial<T>> =>
  (input: Partial<T>) =>
    Object.entries(updaterTuple).reduce(
      <K extends keyof T>(output: Partial<T>, entry: unknown) => {
        const [k, updater] = entry as [K, Updater<T[K]>];
        const v = updater(k in output ? (output[k] as T[K]) : defaultTuple[k]);
        const isDft = isDefault[k] ?? ((u: T[K]) => u === defaultTuple[k]);
        if (isDft(v)) {
          delete output[k];
        } else {
          output[k] = v;
        }
        return output;
      },
      { ...input } as Partial<T>
    ) as Partial<T>;

export const liftOptional =
  <G>(pbo: PartialBinaryOperator<G>): PartialBinaryOperator<G | undefined> =>
  (a, b) =>
    a === undefined || b === undefined ? undefined : pbo(a, b);