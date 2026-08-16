import { describe, expect, it } from "vitest";
import { allocatePaise } from "@fettl/shared";

describe("split allocations", () => {
  it.each([
    [1, [1, 1, 1], [1, 0, 0]],
    [100, [3333, 3333, 3334], [33, 33, 34]],
    [7, [1, 0, 3], [2, 0, 5]],
    [0, [1, 2], [0, 0]],
  ] as const)("distributes %i paise without losing the remainder", (amount, weights, result) => {
    expect(allocatePaise(amount, weights)).toEqual(result);
  });
});
