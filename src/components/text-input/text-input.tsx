"use client";

import FormField from "@/components/form-field/form-field";
import { useFormField } from "@/components/form-field/use-form-field";
import { cn } from "@/lib/cn";
import styles from "./text-input.module.css";
import type { TextInputProps } from "./text-input.types";

export default function TextInput({
  label,
  hint,
  error,
  id,
  className,
  fieldClassName,
  type = "text",
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
  ...rest
}: TextInputProps) {
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
      <input
        {...rest}
        {...field}
        type={type}
        className={cn(styles.input, error && styles.invalid, className)}
      />
    </FormField>
  );
}
