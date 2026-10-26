import Link from "next/link";
import { BookOpen } from "lucide-react";
import styles from "./auth-page-shell.module.css";
import type { AuthPageShellProps } from "./auth-page-shell.types";

export default function AuthPageShell({ title, description, footer, children }: AuthPageShellProps) {
  return (
    <main className={styles.main}>
      <Link href="/" className={styles.brand}><BookOpen aria-hidden="true" />Bookworm</Link>
      <h1 className={styles.heading}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {children}
      <p className={styles.footer}>{footer}</p>
    </main>
  );
}