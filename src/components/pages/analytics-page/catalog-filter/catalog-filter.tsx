"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./catalog-filter.module.css";
import type { CatalogFilterProps } from "./catalog-filter.types";

export default function CatalogFilter({ catalogs }: CatalogFilterProps) {
  const t = useTranslations("pages.analytics");
  const [selectedCatalog, setSelectedCatalog] = useState("all");

  const selectedStats =
    selectedCatalog === "all"
      ? catalogs.reduce(
          (acc, cat) => ({
            read: acc.read + cat.read,
            total: acc.total + cat.total,
          }),
          { read: 0, total: 0 },
        )
      : catalogs.find((cat) => cat.name === selectedCatalog) || {
          read: 0,
          total: 0,
        };

  const percentage =
    selectedStats.total > 0
      ? Math.round((selectedStats.read / selectedStats.total) * 100)
      : 0;

  return (
    <div className={styles.container}>
      <div className={styles.selectorWrapper}>
        <label htmlFor="catalog-select" className={styles.label}>
          {t("byCatalog")}
        </label>
        <select
          id="catalog-select"
          value={selectedCatalog}
          onChange={(e) => setSelectedCatalog(e.target.value)}
          className={styles.select}
        >
          <option value="all">{t("allBooks")}</option>
          {catalogs.map((catalog) => (
            <option key={catalog.name} value={catalog.name}>
              {catalog.name === "uncategorized"
                ? t("uncategorized")
                : catalog.name}
            </option>
          ))}
        </select>
      </div>

      <article className={styles.metric}>
        <p className={styles.metricLabel}>{t("libraryReadPercentageAllTime")}</p>
        <p className={styles.metricValue}>{percentage}%</p>
        <p className={styles.metricContext}>
          {selectedStats.read} {t("of")} {selectedStats.total}{" "}
          {selectedStats.total === 1 ? t("book") : t("books")}
        </p>
      </article>
    </div>
  );
}
