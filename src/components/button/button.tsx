import { cn } from "@/lib/cn";
import styles from "./button.module.css";
import type { ButtonProps } from "./button.types";

export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  "aria-busy": busy,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || busy}
      className={cn(
        styles.button,
        styles[variant],
        loading && styles.loading,
        className,
      )}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      <span className={styles.label}>{children}</span>
    </button>
  );
}
