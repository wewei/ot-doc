import { BehaviorBuilder } from './behavior';
import { signatured } from './signatured';

describe('Signatured behavior', () => {
  const { $number, $string, $boolean, $array, $dict, $struct } =
    BehaviorBuilder.mixin(signatured).build();

  it('should generate the signature of primitive types correctly', () => {
    expect($number.signature).toBe('number');
    expect($string.signature).toBe('string');
    expect($boolean.signature).toBe('boolean');
  });

  it('should generate the signature of the array types correctly', () => {
    const arr1d = $array($number);
    expect(arr1d.signature).toBe('Array<number>');

    const arr2d = $array(arr1d);
    expect(arr2d.signature).toBe('Array<Array<number>>');
  });

  it('should generate the signature of dict types correctly', () => {
    const dict1d = $dict($number);
    expect(dict1d.signature).toBe('Dict<number>');

    const dict2d = $dict(dict1d);
    expect(dict2d.signature).toBe('Dict<Dict<number>>');
  });

  it('should generate the signature of structure types correctly', () => {
    const stt1 = $struct({ foo: $number, bar: $string });
    expect(stt1.signature).toBe('{ foo: number; bar: string }');

    const stt2 = $struct({ foo: $array($number), bar: $dict($string) });
    expect(stt2.signature).toBe('{ foo: Array<number>; bar: Dict<string> }');

  });
});
