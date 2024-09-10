import { describeDocumentMeta, DocumentTestCases } from "../util/test-utility";
import { arrayDocument, Oplet } from "./array-document";

const arrNum = arrayDocument<number>();

describeDocumentMeta('arrayDocument<number>', arrNum, {
  singleton: [
    [],
    [{ typ: 'ins', idx: 0, val: 1 }],
    [{ typ: 'del', idx: 0, val: 1 }],
    [
      { typ: 'del', idx: 0, val: 1 },
      { typ: 'ins', idx: 1, val: 2 },
    ],
    [
      { typ: 'ins', idx: 1, val: 2 },
      { typ: 'del', idx: 0, val: 1 },
    ],
  ],
  composable3: [
    [
      [],
      [
        { typ: 'ins', idx: 1, val: 2 },
        { typ: 'del', idx: 0, val: 1 },
      ],
      [
        { typ: 'del', idx: 0, val: 2 },
        { typ: 'ins', idx: 1, val: 2 },
      ],
    ],
    [
      [
        { typ: 'ins', idx: 1, val: 2 },
        { typ: 'del', idx: 0, val: 1 },
      ],
      [],
      [
        { typ: 'del', idx: 0, val: 2 },
        { typ: 'ins', idx: 1, val: 2 },
      ],
    ],
    [
      [
        { typ: 'ins', idx: 1, val: 2 },
        { typ: 'del', idx: 0, val: 1 },
      ],
      [
        { typ: 'del', idx: 0, val: 2 },
        { typ: 'ins', idx: 1, val: 2 },
      ],
      [],
    ],
  ],
  others({ comp, inv }) {
    // const a: Oplet<number>[] = [{ typ: 'ins', idx: 1, val: 2}, { typ: 'del', idx: 0, val: 1 }];
    // const b = inv(a);
    // console.log(JSON.stringify(a));
    // console.log(JSON.stringify(b));
    // const a_b = comp(a)(b);
    // console.log(JSON.stringify(a_b));
    // const b_a = comp(b)(a);
    // console.log(JSON.stringify(b_a));
  },
} as DocumentTestCases<Oplet<number>[]>);