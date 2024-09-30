import { behavior } from './behavior';

export type Signatured = {
  signature: string;
};

const withSignature = (signature: string): Signatured => ({ signature });

export const signatured = behavior<Signatured>({
  $string: withSignature('string'),
  $number: withSignature('number'),
  $boolean: withSignature('boolean'),
  $array: ({ signature }) => withSignature(`Array<${signature}>`),
  $dict: ({ signature }) => withSignature(`Dict<${signature}>`),
  $struct: (stt) =>
    withSignature(
      `{ ${Object.keys(stt)
        .map((key) => `${key}: ${stt[key].signature}`)
        .join('; ')} }`
    ),
});
