"use client";

import { useId } from "react";
import FormField from "@/components/form-field/form-field";
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
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <FormField
      id={inputId}
      label={label}
      hint={hint}
      error={error}
      className={fieldClassName}
    >
      <input
        {...rest}
        id={inputId}
        type={type}
        aria-invalid={error ? true : invalid}
        aria-describedby={
          [describedBy, message ? messageId : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={cn(styles.input, error && styles.invalid, className)}
      />
    </FormField>
  );
}
