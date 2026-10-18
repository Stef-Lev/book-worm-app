import Link from "next/link";
import styles from "./app-header.module.css";
import type { AppHeaderProps } from "./app-header.types";

export default function AppHeader({ userName }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        Bookworm
      </Link>
      <form action="/search" role="search" className={styles.search}>
        <input
          type="search"
          name="q"
          placeholder="Search by title, author, or ISBN..."
          aria-label="Search books"
          className={styles.input}
        />
      </form>
      <nav className={styles.nav}>
        <Link href="/library">My Library</Link>
        <Link href="/analytics">Analytics</Link>
        <span className={styles.user} title={userName}>
          {userName.charAt(0).toUpperCase()}
        </span>
      </nav>
    </header>
  );
}
