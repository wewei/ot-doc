import { isEqual } from "lodash";

export type Relation<G> = (a: G, b: G) => boolean;
export type UnaryOperator<G> = (a: G) => G;
export type BinaryOperator<G> = (a: G, b: G) => G;

export type Eq<G> = {
  equals: Relation<G>;
};

export function eq<G>(equals: Relation<G>) {
  return { equals };
}

export type Ordered<G> = Eq<G> & {
  lessThan: Relation<G>;
};

export function ordered<G>(
  lessThan: Relation<G>,
  equals: Relation<G> = (a, b) => !lessThan(a, b) && !lessThan(b, a)
) {
  return { lessThan, equals };
}

export type Semigroup<G> = Eq<G> & {
  multiply: BinaryOperator<G>;
};

export function semigroup<G>(
  multiply: BinaryOperator<G>,
  equals: Relation<G> = isEqual
): Semigroup<G> {
  return { multiply, equals };
}

export type Monoid<G> = Semigroup<G> & {
  identity: G;
};

export function monoid<G>(
  multiply: BinaryOperator<G>,
  identity: G,
  equals: Relation<G> = isEqual
): Monoid<G> {
  return { ...semigroup(multiply, equals), identity };
}

export type Group<G> = Monoid<G> & {
  inverse: UnaryOperator<G>;
};

export function group<G>(
  multiply: BinaryOperator<G>,
  identity: G,
  inverse: UnaryOperator<G>,
  equals: Relation<G> = isEqual
): Group<G> {
  return { ...monoid(multiply, identity, equals), inverse };
}

