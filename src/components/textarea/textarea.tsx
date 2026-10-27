"use client";

import FormField from "@/components/form-field/form-field";
import { useFormField } from "@/components/form-field/use-form-field";
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
  const field = useFormField({
    id,
    hint,
    error,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
  });

  return (
    <FormField
      id={field.id}
      label={label}
      hint={hint}
      error={error}
      className={fieldClassName}
    >
      <textarea
        {...rest}
        {...field}
        rows={rows}
        className={cn(styles.textarea, error && styles.invalid, className)}
      />
    </FormField>
  );
}
