import { identity, isUndefined, mapValues, mergeWith } from "lodash";

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
export type Groupoid<G> = {
  // Given 1 operation a, return the inverse operation
  inverse: (a: G) => G;

  // Given 2 consequent operations: a, b, return the composition of the 2
  // operators c. Note, the compose operator is a partial operation, it's not
  // neccessary for all <a, b> ∈ <G, G> to have a composition.
  // Notation: a * b = c
  compose: (a: G, b: G) => G | null;
};

export type DocumentModel<G> = Groupoid<G> & {
  // Given 2 operations based on the same state: a, b, return the inclusive
  // transformation result of a, say a', where a' applies on the state after b,
  // with the same effect as a, considering the impact of b.
  // Notation: a / b = a'
  transform: (a: G, b: G) => G | null;
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
  inverse: (a: G) => G;
  compose: (a: G, b: G) => G;
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
export const abelianDocument = <G>({ inverse, compose }: GroupModel<G>): DocumentModel<G> => ({
  inverse,
  compose,
  transform: identity
});

// Typical abelian group documents
export const numberSumGroup: GroupModel<number> = {
  identity: 0,
  inverse: (x) => -x,
  compose: (x, y) => x + y,
};

export const numberSumDocument = abelianDocument(numberSumGroup);

// Pair groupoid over a total ordered set infers a Greatest Write Win document,
// where
//  <m, x> / <m, y> = <y, max(x, y)>
//  dom(*) = <<x, m>, <m, y>>
//  dom(/) = <<m, x>, <m, y>>
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

export const primitiveEq = {
  equals: <P>(a: P, b: P) => a === b
};

export type OrderedModel<S> = {
  lessThan: (a: S, b: S) => boolean;
};

export const eqFromOrdered = <S>({
  lessThan,
}: OrderedModel<S>): EqModel<S> => ({
  equals: (a, b) => !lessThan(a, b) && !lessThan(b, a),
});

export const primitiveOrder = {
  lessThan: <P>(a: P, b: P) => a < b,
};


export type Pair<S> = [S, S];

export const pairGroupoid = <S>({ equals }: EqModel<S>): Groupoid<Pair<S>> => ({
  inverse: ([from, to]) => [to, from],
  compose: ([fromA, toA], [fromB, toB]) => equals(toA, fromB) ? [fromA, toB] : null,
});

export type GwwDocument<S> = DocumentModel<Pair<S>>;

export const gwwDocument = <S>(
  { lessThan }: OrderedModel<S>,
  { equals }: EqModel<S> = eqFromOrdered({ lessThan })
): GwwDocument<S> => {
  const { inverse, compose } = pairGroupoid({ equals });
  return {
    inverse,
    compose,
    transform: ([, toA], [, toB]) => [toB, lessThan(toB, toA) ? toA : toB],
  };
};

// Based on the GWW document, we can also define a Last Write Win document.
// The key point is to pair a timestamp to the value, and always compare the
// timestamp first
export type Timestamped<S> = [number, S];

export type LwwDocument<S> = GwwDocument<Timestamped<S>>;

export const lwwDocument = <S>(
  { lessThan }: OrderedModel<S>,
  { equals }: EqModel<S> = eqFromOrdered({ lessThan })
): LwwDocument<S> =>
  gwwDocument(
    { lessThan: ([tA, vA], [tB, vB]) => tA < tB || (tA === tB && vA < vB) },
    { equals: ([tA, vA], [tB, vB]) => tA === tB && equals(vA, vB) }
  );

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

// Given a document <G, ~, *, /> and a set S, we can define a power document
// over set S ^ G. Where
// ~x    = { <e, ~x(e)> | e ∈ S }
// x * y = { <e, x(e) * y(e)> | e ∈ S }
// x / y = { <e, x(e) / y(e)> | e ∈ S }
// Prove
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
// then we can represent S ^ G with a Record<string, G> plus a default value
// export const recordDocument = <S>(
//   defaultValue: S,
//   { inverse, compose, transform }: DocumentModel<S>
// ): DocumentModel<Record<string, S>> => ({
//   inverse: (a) => mapValues(a, inverse),
//   compose: (a, b) => mergeWith({ ...a }, b, (x, y) => compose(x ?? defaultValue, y)),
//   transform:
// });