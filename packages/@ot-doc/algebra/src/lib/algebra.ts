export type Eq<G> = {
  equals: (a: G, b: G) => boolean;
};

export function eq<G>(equals: Eq<G>["equals"]) {
  return { equals };
}

export type Ordered<G> = Eq<G> & {
  lessThan: (a: G, b: G) => boolean;
};

export function ordered<G>(
  lessThan: Ordered<G>['lessThan'],
  equals: Eq<G>['equals'] = (a, b) => !lessThan(a, b) && !lessThan(b, a)
) {
  return { lessThan, equals };
}


