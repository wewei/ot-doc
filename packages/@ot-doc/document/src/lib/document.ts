// A complete document model is an algebric groupoid, consists of a set of
// operations (O), 1 unary operator, invert (^), 1 partial binary operator
// compose (*), 1 binary operator transform (/)
//
// Notation: DocumentModel => <O, ^, *, />
//                         where
//                            ^ ∈     O  -> O
//                            * ∈ <O, O> ~> O
//                            / ∈ <O, O> -> O
//
// The following rules are required:
// AP : ∀ a, b, c ∈ O, (a * b) * c = a * (b * c)
// IP1: ∀ a, b ∈ O ∧ <a, b> ∈ dom(*), a * b * ^b = a ∧ ^a * a * b = b
// CP1: ∀ a, b ∈ O, <a, b / a>, <b, a / b> ∈ dom(*) ∧ a * (b / a) = b * (a / b)
export type DocumentModel<O> = {
  // Given 1 operation a, return the inverted
  invert: (op: O) => O;

  // Given 2 consequent operations: a, b, return the composition of the 2
  // operators c.
  // Notation: a * b = c
  compose: (opA: O, opB: O) => O | null;

  // Given 2 operations based on the same state: a, b, return the inclusive
  // transformation result of a, say a', where a' applies on the state after b,
  // with the same effect as a, considering the impact of b.
  // Notation: a / b = a'
  transform: (opA: O, opB: O) => O;
};


export function document(): string {
  return 'document';
}
