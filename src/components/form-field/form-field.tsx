import { cn } from "@/lib/cn";
import styles from "./form-field.module.css";
import type { FormFieldProps } from "./form-field.types";

export default function FormField({
  id,
  label,
  hint,
  error,
  className,
  children,
}: FormFieldProps) {
  const message = error ?? hint;

  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {message && (
        <p
          id={`${id}-message`}
          className={cn(styles.message, error && styles.error)}
        >
          {message}
        </p>
      )}
    </div>
  );
}
