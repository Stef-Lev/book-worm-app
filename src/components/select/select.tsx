import { useId } from "react";
import { cn } from "@/lib/cn";
import styles from "./select.module.css";
import type { SelectProps } from "./select.types";

export default function Select({
  label,
  hint,
  error,
  id,
  className,
  children,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const messageId = `${fieldId}-message`;
  const message = error ?? hint;

  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      <select
        {...rest}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        className={cn(styles.select, error && styles.invalid, className)}
      >
        {children}
      </select>
      {message && (
        <p id={messageId} className={cn(styles.message, error && styles.error)}>
          {message}
        </p>
      )}
    </div>
  );
}
