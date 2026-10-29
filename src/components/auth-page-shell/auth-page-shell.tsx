import Link from "@/components/navigation-link/navigation-link";
import Image from "next/image";
import styles from "./auth-page-shell.module.css";
import type { AuthPageShellProps } from "./auth-page-shell.types";

export default function AuthPageShell({
  title,
  description,
  footer,
  children,
}: AuthPageShellProps) {
  return (
    <main className={styles.main}>
      <Link href="/" className={styles.brand}>
        <Image
          src="/papersmell-logo.svg"
          alt=""
          width={40}
          height={40}
          className={styles.brandMark}
        />
        PaperSmell
      </Link>
      <h1 className={styles.heading}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {children}
      <div className={styles.footer}>{footer}</div>
    </main>
  );
}
