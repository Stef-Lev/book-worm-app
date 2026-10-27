/** Type guard for string enum members, e.g. values read from a URL or request body. */
export function isEnumValue<E extends Record<string, string>>(
  enumObject: E,
  value: unknown,
): value is E[keyof E] {
  return Object.values(enumObject).some((member) => member === value);
}
