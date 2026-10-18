import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Bookworm</h1>
      <p className={styles.tagline}>Track what you read, want to read, and have finished.</p>
      <div className={styles.actions}>
        <Link href="/register" className={styles.button}>
          Get started
        </Link>
        <Link href="/login" className={`${styles.button} ${styles.secondary}`}>
          Log in
        </Link>
      </div>
    </main>
  );
}
