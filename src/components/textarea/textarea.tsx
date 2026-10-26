"use client";

import { useId } from "react";
import FormField from "@/components/form-field/form-field";
import { cn } from "@/lib/cn";
import styles from "./textarea.module.css";
import type { TextareaProps } from "./textarea.types";

export default function Textarea({
  label,
  hint,
  error,
  id,
  className,
  fieldClassName,
  rows = 4,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const message = error ?? hint;

  return (
    <FormField
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      className={fieldClassName}
    >
      <textarea
        {...rest}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : invalid}
        aria-describedby={
          [describedBy, message ? messageId : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={cn(styles.textarea, error && styles.invalid, className)}
      />
    </FormField>
  );
}
