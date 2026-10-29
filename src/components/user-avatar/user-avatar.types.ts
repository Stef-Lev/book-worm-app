import type { ReactNode } from "react";

export type UserAvatarProps = {
  size?: "small" | "medium" | "large";
  as?: "link" | "button";
  href?: string;
  onClick?: () => void;
  children?: ReactNode;
};
