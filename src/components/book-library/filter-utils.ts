export function filterValuesEqual(
  a: string | string[],
  b: string | string[],
): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((val, idx) => val === b[idx]);
  }
  return a === b;
}
