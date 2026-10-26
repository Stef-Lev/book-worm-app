import styles from "./empty-state.module.css";
import type { EmptyStateProps } from "./empty-state.types";

export default function EmptyState({ icon, children }: EmptyStateProps) {
  return (
    <p className={styles.empty}>
      {icon}
      <span>{children}</span>
    </p>
  );
}
