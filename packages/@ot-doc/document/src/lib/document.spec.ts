import { isEqual } from 'lodash';
import {
  sumOfNumber,
  liftOptional,
  DocumentModel,
  gwwNumber,
  Pair,
  gwwString,
  gwwBoolean,
} from './document';

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

const verifyIP1 =
  <G>(
    { compose, inverse }: DocumentModel<G>,
    equals: (a: G, b: G) => boolean = isEqual
  ) =>
  ([a, b]: [G, G]) => {
    const composeT = liftOptional(compose);
    const c = composeT(composeT(a, b), inverse(b));
    expect(c).toBeDefined();
    c && expect(equals(c, a)).toBeTruthy();
    const d = composeT(composeT(inverse(a), a), b);
    expect(d).toBeDefined();
    d && expect(equals(d, b)).toBeTruthy();
  };

const verifyCP1 =
  <G>(
    { compose, transform }: DocumentModel<G>,
    equals: (a: G, b: G) => boolean = isEqual
  ) =>
  ([a, b]: [G, G]) => {
    const composeT = liftOptional(compose);
    const transformT = liftOptional(transform);
    const l = composeT(a, transformT(b, a));
    const r = composeT(b, transformT(a, b));
    expect(l).toBeDefined();
    expect(r).toBeDefined();
    l && r && expect(equals(l, r)).toBeTruthy;
  };

type TestCaseAP<G> = [G, G, G]; // An AP case is a series of 3 operations
type TestCaseIP1<G> = [G, G]; // An IP1 case is a series of 2 operations
type TestCaseCP1<G> = [G, G]; // A CP1 case is a pair of parallel operations
type TestCases<G> = {
  ap: TestCaseAP<G>[];
  ip1: TestCaseIP1<G>[];
  cp1: TestCaseCP1<G>[];
};

const describeDocumentModel = <G>(
  name: string,
  doc: DocumentModel<G>,
  { ap, ip1, cp1 }: TestCases<G>,
  equals: (a: G, b: G) => boolean = isEqual
) => {
  describe(`[Document] ${name}`, () => {
    it('should conform to AP', () => ap.forEach(verifyAP(doc, equals)));
    it('should conform to IP1', () => ip1.forEach(verifyIP1(doc, equals)));
    it('should conform to CP1', () => cp1.forEach(verifyCP1(doc, equals)));
  });
};

describeDocumentModel('sumOfNumber', sumOfNumber(10), {
  ap: [
    [1, 3, 10],
    [-1, 3, 10],
    [0, 0, 0],
    [0.5, 0.0000001, -0.12],
  ],
  ip1: [
    [1, 3],
    [-1, 3],
    [0, 0],
    [0.3, -0.00000001],
  ],
  cp1: [
    [1, 3],
    [-1, 3],
    [0, 0],
    [0.3, -0.00000001],
  ],
});

const gwwTestCaseAP = <G>(x: G, y: G, z: G, w: G): TestCaseAP<Pair<G>> => [
  [x, y],
  [y, z],
  [z, w],
];

const gwwTestCaseIP1 = <G>(x: G, y: G, z: G): TestCaseIP1<Pair<G>> => [
  [x, y],
  [y, z],
];

const gwwTestCaseCP1 = <G>(x: G, y: G, z: G): TestCaseCP1<Pair<G>> => [
  [x, y],
  [x, z],
];

describeDocumentModel('gwwNumber', gwwNumber, {
  ap: [
    gwwTestCaseAP(0, 1, 2, 3),
    gwwTestCaseAP(0, 0, 0, 0),
    gwwTestCaseAP(0, -1, -0.1, 1),
  ],
  ip1: [
    gwwTestCaseIP1(0, 1, 2),
    gwwTestCaseIP1(0, 0, 0),
    gwwTestCaseIP1(0, -1, -0.1),
  ],
  cp1: [
    gwwTestCaseCP1(0, 1, 2),
    gwwTestCaseCP1(0, 0, 0),
    gwwTestCaseCP1(0, 1, 1),
    gwwTestCaseCP1(0, -1, -1),
    gwwTestCaseCP1(0, -1, -0.1),
  ],
});

describeDocumentModel('gwwString', gwwString, {
  ap: [
    gwwTestCaseAP("", "hello", "world", ""),
    gwwTestCaseAP("", "", "", ""),
    gwwTestCaseAP("", "123", "", "123"),
    gwwTestCaseAP("123", "", "", "123"),
  ],
  ip1: [
    gwwTestCaseIP1("", "hello", "world"),
    gwwTestCaseIP1("", "", ""),
    gwwTestCaseIP1("123", "", "foo"),
    gwwTestCaseIP1("foo", "foo", "bar"),
    gwwTestCaseIP1("foo", "bar", "bar"),
  ],
  cp1: [
    gwwTestCaseCP1("", "hello", "world"),
    gwwTestCaseCP1("", "", ""),
    gwwTestCaseCP1("123", "", "foo"),
    gwwTestCaseCP1("foo", "foo", "bar"),
    gwwTestCaseCP1("bar", "bar", "foo"),
    gwwTestCaseCP1("foo", "bar", "bar"),
  ],
});

describeDocumentModel('gwwBoolean', gwwBoolean, {
  ap: [
    gwwTestCaseAP(false, true, false, true),
    gwwTestCaseAP(false, false, false, false),
    gwwTestCaseAP(false, true, true, false),
    gwwTestCaseAP(true, false, false, true),
  ],
  ip1: [
    gwwTestCaseIP1(false, true, false),
    gwwTestCaseIP1(true, true, false),
    gwwTestCaseIP1(false, false, true),
    gwwTestCaseIP1(false, false, false),
    gwwTestCaseIP1(true, true, true),
  ],
  cp1: [
    gwwTestCaseCP1(false, true, false),
    gwwTestCaseCP1(true, true, false),
    gwwTestCaseCP1(false, false, true),
    gwwTestCaseCP1(false, false, false),
    gwwTestCaseCP1(true, true, true),
  ],
});
