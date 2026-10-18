import { useId } from "react";
import { cn } from "@/lib/cn";
import styles from "./textarea.module.css";
import type { TextareaProps } from "./textarea.types";

export default function Textarea({
  label,
  hint,
  error,
  id,
  className,
  rows = 4,
  ...rest
}: TextareaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const message = error ?? hint;

  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <textarea
        {...rest}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(styles.textarea, error && styles.invalid, className)}
      />
      {message && (
        <p id={messageId} className={cn(styles.message, error && styles.error)}>
          {message}
        </p>
      )}
    </div>
  );
}
