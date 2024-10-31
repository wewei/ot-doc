import { BehaviorBuilder } from './behavior';
import editable from './editable';
import { eq } from './eq';
import { just, nothing } from './maybe';
import { preset } from './preset';

describe('Editable behavior', () => {
  const { $number, $string, $boolean, $array, $dict, $struct } =
    BehaviorBuilder.mixin(preset).mixin(eq).mixin(editable).build();

  it('should edit the primitive values correctly', () => {
    expect($number.update((o) => ({ o, n: 1, t: 0 }))(0)).toEqual({
      op: { o: 0, n: 1, t: 0 },
      value: just(1),
    });

    expect($string.update((o) => ({ o, n: 'Bar', t: 0 }))('Foo')).toEqual({
      op: { o: 'Foo', n: 'Bar', t: 0 },
      value: just('Bar'),
    });

    expect($boolean.update((o) => ({ o, n: true, t: 0 }))(false)).toEqual({
      op: { o: false, n: true, t: 0 },
      value: just(true),
    });
  });

  it('should reject if the primitive editing does not match the current', () => {
    expect($number.update(() => ({ o: 0, n: 1, t: 0 }))(2).value).toEqual(
      nothing()
    );
  });

  it('should edit the arrays correctly', () => {
    const arr = $array($number);
    expect(arr.update(() => ({}))([0, 1])).toEqual({
      op: {},
      value: just([0, 1]),
    });

    expect(
      arr.update(() => ({
        d: [{ i: 0, a: [0, 1] }],
      }))([0, 1])
    ).toEqual({
      op: {
        d: [{ i: 0, a: [0, 1] }],
      },
      value: just([]),
    });

    expect(
      arr.update(() => ({
        i: [{ i: 0, a: [3, 4] }],
      }))([0, 1])
    ).toEqual({
      op: {
        i: [{ i: 0, a: [3, 4] }],
      },
      value: just([3, 4, 0, 1]),
    });
  });

  it('should reject if the array editing does not match the current state', () => {
    const arr = $array($number);
    expect(
      arr.update(() => ({
        i: [{ i: 1, a: [3, 4] }],
      }))([]).value
    ).toEqual(nothing());

    expect(
      arr.update(() => ({
        d: [{ i: 0, a: [0, 1]}],
      }))([0]).value
    ).toEqual(nothing());
  });

});
