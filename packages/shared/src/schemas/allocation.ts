// Largest-remainder allocation keeps every paise and breaks ties in participant order.
export function allocatePaise(
  total: number,
  weights: readonly number[],
): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (
    !Number.isSafeInteger(total) ||
    total < 0 ||
    !Number.isFinite(sum) ||
    sum <= 0 ||
    weights.some((weight) => !Number.isFinite(weight) || weight < 0)
  ) {
    throw new RangeError("Invalid split weights or total");
  }
  const shares = weights.map((weight) => total * (weight / sum));
  const result = shares.map(Math.floor);
  const order = shares
    .map((share, index) => ({ index, remainder: share - result[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  const extra = total - result.reduce((a, b) => a + b, 0);
  for (let i = 0; i < extra; i++) result[order[i].index]++;
  return result;
}
