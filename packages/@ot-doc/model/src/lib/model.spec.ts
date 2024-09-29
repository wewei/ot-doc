import { model } from './model';
import { genName } from './__utils__/name';

describe('model', () => {
  it('should work', () => {
    expect(model()).toEqual('model');
    expect(genName().length).toBe(8);
  });
});
