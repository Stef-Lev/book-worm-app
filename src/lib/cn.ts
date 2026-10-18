export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | { [className: string]: unknown };

export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];

  for (const value of values) {
    if (!value) continue;

    if (typeof value === "string" || typeof value === "number") {
      classes.push(String(value));
    } else if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) classes.push(nested);
    } else {
      for (const [className, condition] of Object.entries(value)) {
        if (condition) classes.push(className);
      }
    }
  }

  return classes.join(" ");
}
