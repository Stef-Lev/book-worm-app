import { getTranslations } from "next-intl/server";
import styles from "./reading-over-time.module.css";
import type { ReadingOverTimeProps } from "./reading-over-time.types";

export default async function ReadingOverTime({
  months,
  year,
}: ReadingOverTimeProps) {
  const t = await getTranslations("pages.analytics");
  const yearlyCounts = new Map<number, number>();
  if (year === "all") {
    for (const month of months) {
      yearlyCounts.set(month.year, (yearlyCounts.get(month.year) ?? 0) + month.count);
    }
  }
  const periods = year === "all"
    ? [...yearlyCounts].map(([year, count]) => ({ label: String(year), count }))
    : months.filter((month) => month.year === year);
  const maxCount = periods.reduce((max, period) => Math.max(max, period.count), 1);
  const hasCompletions = periods.some((period) => period.count > 0);

  return (
    <div className={styles.chart}>
      <div className={styles.header}>
        <div>
          <h2 id="reading-over-time">{t("readingOverTime")}</h2>
          <p>
            {year === "all"
              ? t("yearlyCompletions")
              : t("monthlyCompletions", { period: String(year) })}
          </p>
        </div>
      </div>
      {!hasCompletions && <p className={styles.emptyMessage}>{t("noCompletions")}</p>}
      <ul className={styles.monthList}>
        {periods.map(({ label, count }) => (
          <li className={styles.monthRow} key={label}>
            <span>{label}</span>
            <progress
              className={styles.progress}
              max={maxCount}
              value={count}
              aria-label={t("periodCompletionCount", {
                period: year === "all" ? label : `${label} ${year}`,
                count,
              })}
            />
            <span className={styles.count}>{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
