import { BehaviorBuilder } from './behavior';
import { preset } from './preset';

describe('Preset behavior', () => {
  const { $number, $string, $boolean, $array, $dict, $struct } =
    BehaviorBuilder.mixin(preset).build();

  it('should define the preset of primitives correctly', () => {
    expect($number.preset).toBe(0);
    expect($string.preset).toBe('');
    expect($boolean.preset).toBe(false);
  });

  it('should define the preset of arrays correctly', () => {
    const arr1d = $array($number);
    expect(arr1d.preset).toEqual([]);

    const arr2d = $array($array($number));
    expect(arr2d.preset).toEqual([]);
  });

  it('should define the preset of the dict', () => {
    const dict1d = $dict($number);
    expect(dict1d.preset).toEqual({});

    const dict2d = $dict($dict($number));
    expect(dict2d.preset).toEqual({});
  });

  it('should define the preset of the struct', () => {
    const stt = $struct({ foo: $number, bar: $string });
    expect(stt.preset).toEqual({ foo: 0, bar: '' });
  });
});
