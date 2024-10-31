import { BehaviorBuilder } from './behavior';
import { preset } from './preset';
import readable, { readData } from './readable';
import { signatured } from './signatured';
import { eq } from './eq';

describe('Readable behavior', () => {
  const { $number, $string, $boolean, $array, $dict, $struct } =
    BehaviorBuilder.mixin(preset)
      .mixin(signatured)
      .mixin(eq)
      .mixin(readable)
      .build();

  it('should read primitives and report error if does not fit', () => {
    const report = vi.fn();
    const raise = (path: string) => (message: string) => report(path, message);

    expect($number.read(raise)('123')).toBe(0);
    expect(report).toHaveBeenLastCalledWith('', 'requires number');
    report.mockClear();

    expect($number.read(raise)(1)).toBe(1);
    expect(report).not.toHaveBeenCalled();
    report.mockClear();

    expect($string.read(raise)(null)).toBe('');
    expect(report).toHaveBeenLastCalledWith('', 'requires string');
    report.mockClear();

    expect($string.read(raise)('Hello')).toBe('Hello');
    expect(report).not.toHaveBeenCalled();
    report.mockClear();

    expect($boolean.read(raise)(null)).toBe(false);
    expect(report).toHaveBeenLastCalledWith('', 'requires boolean');
    report.mockClear();

    expect($boolean.read(raise)(true)).toBe(true);
    expect(report).not.toHaveBeenCalled();
    report.mockClear();
  });

  it('should read the array object, and report errors', () => {
    const arr1d = $array($number);
    const report = vi.fn();
    const raise = (path: string) => (message: string) => report(path, message);
    expect(arr1d.read(raise)([1, 2, 3])).toEqual([1, 2, 3]);
    expect(report).not.toHaveBeenCalled();
    report.mockClear();

    expect(arr1d.read(raise)({})).toEqual([]);
    expect(report).toHaveBeenLastCalledWith('', 'requires Array<number>');
    report.mockClear();

    expect(arr1d.read(raise)(['1', 2, 3])).toEqual([0, 2, 3]);
    expect(report).toHaveBeenLastCalledWith('[0]', 'requires number');
    report.mockClear();
  });

  it('should read the dict object, and report errors', () => {
    const dict1d = $dict($number);
    const report = vi.fn();
    const raise = (path: string) => (message: string) => report(path, message);
    expect(dict1d.read(raise)({})).toEqual({});
    expect(report).not.toHaveBeenCalled();
    report.mockClear();

    expect(dict1d.read(raise)({ foo: 1, bar: 2 })).toEqual({ foo: 1, bar: 2 });
    expect(report).not.toHaveBeenCalled();
    report.mockClear();

    expect(dict1d.read(raise)({ foo: 1, bar: 0 })).toEqual({ foo: 1 });
    expect(report).not.toHaveBeenCalled();
    report.mockClear();

    expect(dict1d.read(raise)({ foo: 1, bar: 'bar' })).toEqual({ foo: 1 });
    expect(report).toHaveBeenLastCalledWith('.bar', 'requires number');
    report.mockClear();

    expect(dict1d.read(raise)(null)).toEqual({});
    expect(report).toHaveBeenLastCalledWith('', 'requires Dict<number>');
    report.mockClear();
  });

  it('should read thre struct object, and report errors', () => {
    const stt = $struct({ foo: $number, bar: $string });
    const report = vi.fn();
    const raise = (path: string) => (message: string) => report(path, message);

    expect(stt.read(raise)({ foo: 1, bar: 'bar' })).toEqual({
      foo: 1,
      bar: 'bar',
    });
    expect(report).not.toHaveBeenCalled();
    report.mockClear();

    expect(stt.read(raise)(null)).toEqual({ foo: 0, bar: '' });
    expect(report).toHaveBeenLastCalledWith(
      '',
      'requires { foo: number; bar: string }'
    );
    report.mockClear();

    expect(stt.read(raise)({ foo: 'foo', bar: 'bar' })).toEqual({
      foo: 0,
      bar: 'bar',
    });
    expect(report).toHaveBeenLastCalledWith('.foo', 'requires number');
    report.mockClear();
  });

  describe('readData function', () => {
    it('should read data following the schema and report errors', () => {
      const stt = $struct({
        points: $array(
          $struct({
            x: $number,
            y: $number,
          })
        ),
        gradient: $struct({
          start: $string,
          middle: $string,
          end: $string,
        }),
      });
      const report = vi.fn();
      const input = {
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
          { x: 'foo', y: 5, z: 6 },
        ],
        gradient: {
          start: 'red',
          middle: 'blue',
          end: 123,
        },
      };
      const output = {
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
          { x: 0, y: 5 },
        ],
        gradient: {
          start: 'red',
          middle: 'blue',
          end: '',
        },
      };

      expect(readData(stt)(input)).toEqual(output);
      expect(readData(stt)(input, report)).toEqual(output);
      expect(report).toHaveBeenCalledTimes(2);
      expect(report).toHaveBeenCalledWith('requires number, at $.points[2].x');
      expect(report).toHaveBeenCalledWith('requires string, at $.gradient.end');
      report.mockClear();
    });
  });
});
