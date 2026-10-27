import type { LucideIcon } from "lucide-react";

export type StatusPageProps = {
  code: number;
  title: string;
  description: string;
  icon: LucideIcon;
  action: {
    href: string;
    label: string;
  };
};
