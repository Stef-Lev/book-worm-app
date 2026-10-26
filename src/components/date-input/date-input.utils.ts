import { parseDate, type DateValue } from "@ark-ui/react/date-picker";
import { isMatch } from "date-fns";

export function formatInputDate(date: DateValue): string {
  return `${String(date.day).padStart(2, "0")}/${String(date.month).padStart(2, "0")}/${String(date.year).padStart(4, "0")}`;
}

export function parseInputDate(value: string): DateValue | undefined {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value) || !isMatch(value, "dd/MM/yyyy")) {
    return undefined;
  }
  const [day, month, year] = value.split("/");
  return parseDate(`${year}-${month}-${day}`);
}
