import type { ReactNode } from "react";

export type MobileNavigationProps = {
  links: { href: string; label: string }[];
  children: ReactNode;
};
