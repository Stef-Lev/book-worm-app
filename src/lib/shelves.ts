import { isEnumValue } from "@/lib/enums";

export enum Shelf {
  ToRead = "to-read",
  CurrentlyReading = "currently-reading",
  Read = "read",
  DidNotFinish = "did-not-finish",
}

export const SHELVES = Object.values(Shelf);

export function isShelf(value: unknown): value is Shelf {
  return isEnumValue(Shelf, value);
}
