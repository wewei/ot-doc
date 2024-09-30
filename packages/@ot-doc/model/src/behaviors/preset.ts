import { behavior } from './behavior';
import { mapStruct } from './struct';
import { $Var } from './variables';

export type Preset<T = $Var> = { preset: T };

const withPreset = <T>(preset: T): Preset<T> => ({ preset });

export const preset = behavior<Preset>({
  $string: withPreset(''),
  $number: withPreset(0),
  $boolean: withPreset(false),
  $array: () => withPreset([]),
  $dict: () => withPreset({}),
  $struct: (stt) => withPreset(mapStruct(stt, ({ preset }) => preset)),
});

