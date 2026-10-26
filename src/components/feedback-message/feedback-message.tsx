import { cn } from "@/lib/cn";
import styles from "./feedback-message.module.css";
import type { FeedbackMessageProps } from "./feedback-message.types";

export default function FeedbackMessage({
  tone = "status",
  className,
  children,
}: FeedbackMessageProps) {
  if (children === undefined || children === null || children === "")
    return null;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        styles.message,
        tone === "error" && styles.error,
        className,
      )}
    >
      {children}
    </p>
  );
}
