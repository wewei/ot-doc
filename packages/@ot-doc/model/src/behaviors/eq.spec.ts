import { BehaviorBuilder } from './behavior';
import { eq } from './eq';
import { preset } from './preset';

describe('Eq behavior', () => {
  const { $number, $string, $boolean, $array, $dict, $struct } =
    BehaviorBuilder.mixin(preset).mixin(eq).build();
  it('should compare the primitives correctly', () => {
    expect($number.eq(0)(1)).toBe(false);
    expect($number.eq(0)(0)).toBe(true);

    expect($string.eq('')('ABC')).toBe(false);
    expect($string.eq('ABCD')('ABC')).toBe(false);
    expect($string.eq('ABC')('ABC')).toBe(true);

    expect($boolean.eq(true)(false)).toBe(false);
    expect($boolean.eq(true)(true)).toBe(true);
    expect($boolean.eq(false)(false)).toBe(true);
  });

  it('should compare the arrays correctly', () => {
    const arr1d = $array($number);
    expect(arr1d.eq([])([1])).toBeFalsy();
    expect(arr1d.eq([-1])([1])).toBeFalsy();
    expect(arr1d.eq([1, 2, 3])([1, 2, 3])).toBeTruthy();

    const arr2d = $array($array($number));
    expect(arr2d.eq([])([[]])).toBeFalsy();
    expect(arr2d.eq([[1, 2, 3], []])([[1, 2, 3]])).toBeFalsy();
    expect(
      arr2d.eq([
        [1, 2, 3],
        [1, 2],
      ])([
        [1, 2, 3],
        [1, 2],
      ])
    ).toBeTruthy();
  });

  it('should compare the dicts correctly', () => {
    const dict1d = $dict($number);
    expect(dict1d.eq({})({})).toBeTruthy();
    expect(dict1d.eq({ foo: 1, bar: 2 })({ foo: 1, bar: 2 })).toBeTruthy();
    expect(dict1d.eq({ foo: 1 })({ foo: 1, bar: 0 })).toBeTruthy();
    expect(dict1d.eq({ foo: 1, bar: 2 })({ foo: 2, bar: 1 })).toBeFalsy();
    expect(dict1d.eq({ foo: 1 })({ foo: 1, bar: 2 })).toBeFalsy();
    expect(dict1d.eq({ foo: 1, bar: 2 })({ bar: 2 })).toBeFalsy();

    const dict2d = $dict($dict($number));
    expect(dict2d.eq({})({})).toBeTruthy();
    expect(dict2d.eq({ foo: { bar: 1 } })({ foo: { bar: 1 } })).toBeTruthy();
    expect(
      dict2d.eq({ foo: { bar: 1 }, bar: {} })({ foo: { bar: 1 } })
    ).toBeTruthy();
    expect(dict2d.eq({})({ foo: { bar: 1 } })).toBeFalsy();
  });

  it('should compare the structs correctly', () => {
    const stt = $struct({ foo: $number, bar: $string });

    expect(stt.eq({ foo: 1, bar: 'tic' })({ foo: 1, bar: 'tic' })).toBeTruthy();
    expect(stt.eq({ foo: 1, bar: '' })({ foo: 1, bar: 'tic' })).toBeFalsy();
    expect(stt.eq({ foo: 0, bar: 'tic' })({ foo: 1, bar: 'tic' })).toBeFalsy();
  });
});
