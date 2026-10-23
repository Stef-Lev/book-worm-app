import styles from "./route-loading.module.css";

export default function RouteLoading() {
  return (
    <div className={styles.loading} role="status" aria-busy="true">
      <span className={styles.brand}>Bookworm</span>
      <div className={styles.placeholder} aria-hidden="true" />
    </div>
  );
}
