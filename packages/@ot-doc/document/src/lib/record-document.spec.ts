import { gwwDocument } from './gww-document';
import { recordDocument } from './record-document';
import { describeDocumentMeta } from './test-utility';

const recGww = recordDocument(gwwDocument<string>());

describeDocumentMeta('Record<string, Gww<string>>', recGww, {
  singleton: [
    {},
    { foo: ['abc', 'cba'] },
    { foo: ['abc', 'cba'], bar: ['cba', ''] },
    { foo: ['abc', 'cba'], bar: null },
  ],
  composable3: [
    [{}, { foo: ['abc', 'cba'], bar: ['cba', 'xyz'] }, { foo: ['cba', 'zyx'] }],
    [{ foo: ['abc', 'cba'], bar: ['cba', 'xyz'] }, {}, { foo: ['cba', 'zyx'] }],
    [{ foo: ['abc', 'cba'], bar: ['cba', 'xyz'] }, { foo: ['cba', 'zyx'] }, {}],
    [{ foo: ['abc', 'cba'], bar: ['cba', 'xyz'] }, {}, { foo: ['abc', 'zyx'] }],
  ],
  incomposable: [[{ foo: ['abc', 'cba'] }, { foo: ['abc', 'xyz'] }]],
  transformable: [[{ foo: ['abc', 'cba']}, { bar: ['cba', 'abc']}]],
  
});
