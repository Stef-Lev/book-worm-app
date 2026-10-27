"use client";

import { useId } from "react";

type UseFormFieldOptions = {
  id?: string;
  hint?: string;
  error?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
};

/**
 * Shared id and ARIA wiring for controls rendered inside `FormField`, linking
 * the control to the hint/error message that `FormField` renders.
 */
export function useFormField({
  id,
  hint,
  error,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: UseFormFieldOptions) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = (error ?? hint) ? `${fieldId}-message` : undefined;

  return {
    id: fieldId,
    "aria-invalid": error ? true : invalid,
    "aria-describedby":
      [describedBy, messageId].filter(Boolean).join(" ") || undefined,
  };
}
