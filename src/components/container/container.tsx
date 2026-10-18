import { cn } from "@/lib/cn";
import styles from "./container.module.css";
import type { ContainerProps } from "./container.types";

export default function Container({ children, className }: ContainerProps) {
  return <div className={cn(styles.container, className)}>{children}</div>;
}
