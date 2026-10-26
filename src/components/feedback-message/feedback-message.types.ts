import type { ReactNode } from "react";

export type FeedbackMessageProps = {
  tone?: "status" | "error";
  className?: string;
  children?: ReactNode;
};