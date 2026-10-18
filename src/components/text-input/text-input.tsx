import { useId } from "react";
import { cn } from "@/lib/cn";
import styles from "./text-input.module.css";
import type { TextInputProps } from "./text-input.types";

export default function TextInput({
  label,
  hint,
  error,
  id,
  className,
  type = "text",
  ...rest
}: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? hint;

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input
        {...rest}
        id={inputId}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(styles.input, error && styles.invalid, className)}
      />
      {message && (
        <p id={messageId} className={cn(styles.message, error && styles.error)}>
          {message}
        </p>
      )}
    </div>
  );
}
