import { Comparator, isEqual } from 'lodash';
import {
  sumOfNumber,
  liftOptional,
  DocumentModel,
  gwwNumber,
  Gww,
  gwwString,
  gwwBoolean,
  EqModel,
  lwwString,
  BinaryOperator,
  UnaryOperator,
  Lww,
  lwwNumber,
  lwwBoolean,
} from './document';

type DocumentOperators<G> = {
  $c: BinaryOperator<G | undefined>;
  $t: BinaryOperator<G | undefined>;
  $i: UnaryOperator<G | undefined>;
  $e: Comparator<G | undefined>;
};

const operators = <G>(
  { inverse, compose, transform }: DocumentModel<G>,
  { equals }: EqModel<G>
): DocumentOperators<G> => ({
  $c: liftOptional(compose),
  $t: liftOptional(transform),
  $i: (a) => (a === undefined ? undefined : inverse(a)),
  $e: (a, b) => a !== undefined && b !== undefined && equals(a, b),
});

const verifyAP =
  <G>({ $c, $e }: DocumentOperators<G>) =>
  ({ops: [a, b, c], rlt }: TestCaseAP<G>) => {
    expect($e($c($c(a, b), c), rlt)).toBeTruthy();
    expect($e($c(a, $c(b, c)), rlt)).toBeTruthy();
  };

const verifyIP1 =
  <G>({ $c, $e, $i }: DocumentOperators<G>) =>
  ({ ops: [a, b] }: TestCaseIP1<G>) => {
    expect($e($c($c(a, b), $i(b)), a)).toBeTruthy();
    expect($e($c($c($i(a), a), b), b)).toBeTruthy();
  };

const verifyCP1 =
  <G>({ $c, $t, $e }: DocumentOperators<G>) =>
  ({ ops: [a, b], rlt }: TestCaseCP1<G>) => {
    expect($e($c(a, $t(b, a)), rlt)).toBeTruthy();
    expect($e($c(b, $t(a, b)), rlt)).toBeTruthy();
  };

type TestCaseAP<G> = { ops: [G, G, G]; rlt: G };
type TestCaseIP1<G> = { ops: [G, G] };
type TestCaseCP1<G> = { ops: [G, G]; rlt: G };
type TestCases<G> = {
  ap: TestCaseAP<G>[];
  ip1: TestCaseIP1<G>[];
  cp1: TestCaseCP1<G>[];
  others?: (ops: DocumentOperators<G>) => void;
};

const describeDocumentModel = <G>(
  name: string,
  doc: DocumentModel<G>,
  { ap, ip1, cp1, others }: TestCases<G>,
  eq: EqModel<G> = { equals: isEqual }
) => {
  const ops = operators(doc, eq);
  describe(`[Document] ${name}`, () => {
    it('should conform to AP', () => ap.forEach(verifyAP(ops)));
    it('should conform to IP1', () => ip1.forEach(verifyIP1(ops)));
    it('should conform to CP1', () => cp1.forEach(verifyCP1(ops)));

    others && describe('Other cases', () => others(ops));
  });
};

describeDocumentModel('sumOfNumber', sumOfNumber(10), {
  ap: [
    { ops: [1, 3, 10], rlt: 14 },
    { ops: [-1, 3, 10], rlt: 12 },
    { ops: [0, 0, 0], rlt: 0 },
    { ops: [0.5, 0.0000001, -0.12], rlt: 0.3800001 },
  ],
  ip1: [
    { ops: [1, 3] },
    { ops: [-1, 3] },
    { ops: [0, 0] },
    { ops: [0.3, -0.00000001] },
  ],
  cp1: [
    { ops: [1, 3], rlt: 4 },
    { ops: [-1, 3], rlt: 2 },
    { ops: [0, 0], rlt: 0 },
    { ops: [0.3, -0.00000001], rlt: 0.29999999 },
  ],
});

const gwwTestCaseAP = <G>(x: G, y: G, z: G, w: G): TestCaseAP<Gww<G>> => ({
  ops: [
    [x, y],
    [y, z],
    [z, w],
  ],
  rlt: [x, w],
});

const gwwTestCaseIP1 = <G>(x: G, y: G, z: G): TestCaseIP1<Gww<G>> => ({
  ops: [
    [x, y],
    [y, z],
  ],
});

const gwwTestCaseCP1 = <G>(x: G, y: G, z: G, rlt: Gww<G>): TestCaseCP1<Gww<G>> => ({
  ops: [
    [x, y],
    [x, z],
  ],
  rlt,
});

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
    gwwTestCaseCP1(0, 1, 2, [0, 2]),
    gwwTestCaseCP1(0, 0, 0, [0, 0]),
    gwwTestCaseCP1(0, 1, 1, [0, 1]),
    gwwTestCaseCP1(0, -1, -1, [0, -1]),
    gwwTestCaseCP1(0, -1, -0.1, [0, -0.1]),
  ],

  others: ({ $c, $t }) => {
    it('should return `undefined` when composing none-sequential operations', () => {
      expect($c([0, 1], [0, 2])).toBeUndefined();
    });

    it('should return `undefined` when transforming none-same-origin operations', () => {
      expect($t([0, 1], [1, 2])).toBeUndefined();
    });
  },
});

describeDocumentModel('gwwString', gwwString, {
  ap: [
    gwwTestCaseAP('', 'hello', 'world', ''),
    gwwTestCaseAP('', '', '', ''),
    gwwTestCaseAP('', '123', '', '123'),
    gwwTestCaseAP('123', '', '', '123'),
  ],
  ip1: [
    gwwTestCaseIP1('', 'hello', 'world'),
    gwwTestCaseIP1('', '', ''),
    gwwTestCaseIP1('123', '', 'foo'),
    gwwTestCaseIP1('foo', 'foo', 'bar'),
    gwwTestCaseIP1('foo', 'bar', 'bar'),
  ],
  cp1: [
    gwwTestCaseCP1('', 'hello', 'world', ['', 'world']),
    gwwTestCaseCP1('', '', '', ['', '']),
    gwwTestCaseCP1('123', '', 'foo', ['123', 'foo']),
    gwwTestCaseCP1('foo', 'foo', 'bar', ['foo', 'foo']),
    gwwTestCaseCP1('bar', 'bar', 'foo', ['bar', 'foo']),
    gwwTestCaseCP1('foo', 'bar', 'bar', ['foo', 'bar']),
  ],
  others: ({ $c, $t }) => {
    it('should return `undefined` when composing none-sequential operations', () => {
      expect($c(['', 'foo'], ['', 'bar'])).toBeUndefined();
    });

    it('should return `undefined` when transforming none-same-origin operations', () => {
      expect($t(['', 'foo'], ['foo', 'bar'])).toBeUndefined();
    });
  },
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
    gwwTestCaseCP1(false, true, false, [false, true]),
    gwwTestCaseCP1(true, true, false, [true, true]),
    gwwTestCaseCP1(false, false, true, [false, true]),
    gwwTestCaseCP1(false, false, false, [false, false]),
    gwwTestCaseCP1(true, true, true, [true, true]),
  ],
  others: ({ $c, $t }) => {
    it('should return `undefined` when composing none-sequential operations', () => {
      expect($c([false, true], [false, true])).toBeUndefined();
    });

    it('should return `undefined` when transforming none-same-origin operations', () => {
      expect($t([true, false], [false, true])).toBeUndefined();
    });
  }
});

const lwwTestCaseAP = <G>(x: G, y: G, z: G, w: G): TestCaseAP<Lww<G>> => ({
  ops: [
    [ [0, x], [1, y] ],
    [ [1, y], [2, z] ],
    [ [2, z], [3, w] ],
  ],
  rlt: [ [0, x], [3, w] ],
});

const lwwTestCaseIP1 = <G>(x: G, y: G, z: G): TestCaseIP1<Lww<G>> => ({
  ops: [
    [ [0, x], [1, y] ],
    [ [1, y], [2, z] ],
  ],
});

const lwwTestCaseCP1 = <G>(
  x: G,
  y: G,
  z: G,
  rlt: Lww<G>,
  isSim = false,
): TestCaseCP1<Lww<G>> => ({
  ops: [
    [ [0, x], [1, y] ],
    [ [0, x], [isSim ? 1 : 2, z] ],
  ],
  rlt,
});

describeDocumentModel('lwwNumber', lwwNumber, {
  ap: [
    lwwTestCaseAP(0, 1, 2, 3),
    lwwTestCaseAP(0, 0, 0, 0),
    lwwTestCaseAP(0, -1, -0.1, 1),
  ],
  ip1: [
    lwwTestCaseIP1(0, 1, 2),
    lwwTestCaseIP1(0, 0, 0),
    lwwTestCaseIP1(0, -1, -0.1),
  ],
  cp1: [
    lwwTestCaseCP1(0, 1, 2, [[0, 0], [2, 2]]),
    lwwTestCaseCP1(0, 0, 0, [[0, 0], [2, 0]]),
    lwwTestCaseCP1(0, 1, 1, [[0, 0], [2, 1]]),
    lwwTestCaseCP1(0, 1, -1, [[0, 0], [2, -1]]),
    lwwTestCaseCP1(0, -1, -0.1, [[0, 0], [2, -0.1]]),
    // Simultaneously update
    lwwTestCaseCP1(0, 1, 1, [[0, 0], [1, 1]], true),
    lwwTestCaseCP1(0, 1, -1, [[0, 0], [1, 1]], true),
  ],
});


describeDocumentModel('lwwString', lwwString, {
  ap: [
    lwwTestCaseAP('', 'hello', 'world', ''),
    lwwTestCaseAP('', '', '', ''),
    lwwTestCaseAP('', '123', '', '123'),
    lwwTestCaseAP('123', '', '', '123'),
  ],
  ip1: [
    lwwTestCaseIP1('', 'hello', 'world'),
    lwwTestCaseIP1('', '', ''),
    lwwTestCaseIP1('123', '', 'foo'),
    lwwTestCaseIP1('foo', 'foo', 'bar'),
    lwwTestCaseIP1('foo', 'bar', 'bar'),
  ],
  cp1: [
    lwwTestCaseCP1('', 'hello', 'world', [[0, ''], [2, 'world']]),
    lwwTestCaseCP1('', '', '', [[0, ''], [2, '']]),
    lwwTestCaseCP1('123', '', 'foo', [[0, '123'], [2, 'foo']]),
    lwwTestCaseCP1('foo', 'foo', 'bar', [[0, 'foo'], [2, 'bar']]),
    lwwTestCaseCP1('bar', 'bar', 'foo', [[0, 'bar'], [2, 'foo']]),
    lwwTestCaseCP1('foo', 'bar', 'bar', [[0, 'foo'], [2, 'bar']]),
    // Simultaneously update
    lwwTestCaseCP1('', '', '', [[0, ''], [1, '']], true),
    lwwTestCaseCP1('foo', 'foo', 'bar', [[0, 'foo'], [1, 'foo']], true),
  ],
});

describeDocumentModel('lwwBoolean', lwwBoolean, {
  ap: [
    lwwTestCaseAP(false, true, false, true),
    lwwTestCaseAP(false, false, false, false),
    lwwTestCaseAP(false, true, true, false),
    lwwTestCaseAP(true, false, false, true),
  ],
  ip1: [
    lwwTestCaseIP1(false, true, false),
    lwwTestCaseIP1(true, true, false),
    lwwTestCaseIP1(false, false, true),
    lwwTestCaseIP1(false, false, false),
    lwwTestCaseIP1(true, true, true),
  ],
  cp1: [
    lwwTestCaseCP1(false, true, false, [[0, false], [2, false]]),
    lwwTestCaseCP1(true, true, false, [[0, true], [2, false]]),
    lwwTestCaseCP1(false, false, true, [[0, false], [2, true]]),
    lwwTestCaseCP1(false, false, false, [[0, false], [2, false]]),
    lwwTestCaseCP1(true, true, true, [[0, true], [2, true]]),
    // Simultaneously update
    lwwTestCaseCP1(false, true, false, [[0, false], [1, true]], true),
    lwwTestCaseCP1(true, true, false, [[0, true], [1, true]], true),
  ],
});
