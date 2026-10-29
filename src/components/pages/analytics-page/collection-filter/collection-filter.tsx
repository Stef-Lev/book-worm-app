"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Dropdown from "@/components/dropdown/dropdown";
import styles from "./collection-filter.module.css";
import type { CollectionFilterProps } from "./collection-filter.types";

export default function CollectionFilter({
  collections,
}: CollectionFilterProps) {
  const t = useTranslations("pages.analytics");
  const [selectedCollectionId, setSelectedCollectionId] = useState("all");

  const selectedStats =
    selectedCollectionId === "all"
      ? collections.reduce(
          (acc, col) => ({
            read: acc.read + col.read,
            total: acc.total + col.total,
          }),
          { read: 0, total: 0 },
        )
      : collections.find((col) => col.id === selectedCollectionId) || {
          read: 0,
          total: 0,
        };

  const percentage =
    selectedStats.total > 0
      ? Math.round((selectedStats.read / selectedStats.total) * 100)
      : 0;

  const options = [
    { value: "all", label: t("allCollections") },
    ...collections.map((collection) => ({
      value: collection.id,
      label: collection.name,
    })),
  ];

  return (
    <div className={styles.container}>
      <Dropdown
        id="analytics-collection"
        label={t("byCollection")}
        fieldClassName={styles.field}
        size="sm"
        value={selectedCollectionId}
        onValueChange={setSelectedCollectionId}
        options={options}
      />

      <article className={styles.metric}>
        <p className={styles.metricLabel}>{t("libraryReadPercentageAllTime")}</p>
        <p className={styles.metricValue}>{percentage}%</p>
        <p className={styles.metricContext}>
          {selectedStats.read} of {selectedStats.total}{" "}
          {selectedStats.total === 1 ? "book" : "books"}
        </p>
      </article>
    </div>
  );
}
