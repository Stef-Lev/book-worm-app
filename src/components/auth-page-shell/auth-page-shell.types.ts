import type { ReactNode } from "react";

export type AuthPageShellProps = {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};
