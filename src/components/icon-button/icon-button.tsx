import { cn } from "@/lib/cn";
import styles from "./icon-button.module.css";
import type { IconButtonProps } from "./icon-button.types";

export default function IconButton({
  label,
  title = label,
  type = "button",
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      className={cn(styles.button, className)}
      aria-label={label}
      title={title}
    >
      {children}
    </button>
  );
}
