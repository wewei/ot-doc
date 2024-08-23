import { isEqual } from 'lodash';
import { numberSumDocument, liftOptional, DocumentModel } from './document';

const verifyAP =
  <G>(
    { compose }: DocumentModel<G>,
    equals: (a: G, b: G) => boolean = isEqual
  ) =>
  ([a, b, c]: [G, G, G]) => {
    const composeT = liftOptional(compose);
    const l = composeT(composeT(a, b), c);
    const r = composeT(a, composeT(b, c));
    expect(l).toBeDefined();
    expect(r).toBeDefined();
    l && r && expect(equals(l, r)).toBeTruthy();
  };

const verifyIP1 = <G>(
  { compose, inverse }: DocumentModel<G>,
  equals: (a: G, b: G) => boolean = isEqual
) => ([a, b]: [G, G]) => {
  const composeT = liftOptional(compose);
  const c = composeT(composeT(a, b), inverse(b));
  expect(c).toBeDefined();
  c && expect(equals(c, a)).toBeTruthy();
  const d = composeT(composeT(a, inverse(a)), b);
  expect(d).toBeDefined();
  d && expect(equals(d, b)).toBeTruthy();
};

describe('numberSumDocument', () => {
  const doc = numberSumDocument(10);
  it('should conform to AP', () => {
    (
      [
        [1, 3, 10],
        [-1, 3, 10],
        [0, 0, 0],
        [0.5, 0.0000001, -0.12],
      ] as [number, number, number][]
    ).forEach(verifyAP(doc));
  });

  it('should conform to CP1', () => {
    (
      [
        [1, 3],
        [-1, 3],
        [0, 0],
        [0.3, -0.00000001],
      ] as [number, number][]
    ).forEach(verifyIP1(doc));
  });
});
