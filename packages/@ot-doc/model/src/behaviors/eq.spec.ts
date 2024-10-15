import { BehaviorBuilder } from "./behavior";
import { eq } from "./eq";

describe("Eq behavior", () => {
  const { $number, $string, $boolean, $array, $dict, $struct } = BehaviorBuilder.mixin(eq).build();
  it("should compare the primitives correctly", () => {
    expect($number.eq(0)(1)).toBe(false);
    expect($number.eq(0)(0)).toBe(true);
  });
});