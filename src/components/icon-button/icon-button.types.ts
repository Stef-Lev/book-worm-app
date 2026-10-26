import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label"
> & {
  label: string;
  children: ReactNode;
};
