import type { ComponentPropsWithoutRef } from "react";
import type { Trigger } from "@radix-ui/react-select";

export type DropdownOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
  count?: number;
};

export type DropdownProps = Omit<
  ComponentPropsWithoutRef<typeof Trigger>,
  "children" | "value" | "defaultValue" | "onChange" | "dir"
> & {
  label: string;
  options: readonly DropdownOption[];
  value: string | number;
  onValueChange: (value: string) => void;
  hint?: string;
  error?: string;
  fieldClassName?: string;
  size?: "sm" | "md";
  name?: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
};
