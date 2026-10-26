import styles from "./route-loading.module.css";

export default function RouteLoading() {
  return (
    <span className={styles.loading} role="status" aria-busy="true">
      <span className={styles.spinner} aria-hidden="true" />
    </span>
  );
}
