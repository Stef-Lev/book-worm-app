import { ArrowRight } from "lucide-react";
import Link from "@/components/navigation-link/navigation-link";
import { cn } from "@/lib/cn";
import buttonStyles from "@/components/button/button.module.css";
import styles from "./status-page.module.css";
import type { StatusPageProps } from "./status-page.types";

export default function StatusPage({
  code,
  title,
  description,
  icon: Icon,
  action,
}: StatusPageProps) {
  return (
    <main className={styles.main} aria-labelledby="status-title">
      <div className={styles.content}>
        <p className={styles.code}>{code}</p>
        <h1 id="status-title" className={styles.title}>
          {title}
        </h1>
        <p className={styles.description}>{description}</p>
        <Icon className={styles.icon} aria-hidden="true" />
        <Link
          href={action.href}
          className={cn(
            buttonStyles.button,
            buttonStyles.primary,
            styles.action,
          )}
        >
          <span className={buttonStyles.label}>
            {action.label}
            <ArrowRight aria-hidden="true" />
          </span>
        </Link>
      </div>
    </main>
  );
}
