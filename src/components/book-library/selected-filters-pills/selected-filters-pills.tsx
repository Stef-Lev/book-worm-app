"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LibraryFilterKey } from "@/lib/library";
import type { SelectedFiltersPillsProps } from "./selected-filters-pills.types";
import styles from "./selected-filters-pills.module.css";

export default function SelectedFiltersPills({
  values,
  defaults,
  sections,
  onRemoveFilter,
  onClearAll,
}: SelectedFiltersPillsProps) {
  const t = useTranslations("libraryWorkspace");

  const activeFilters = sections.filter(
    (section) =>
      section.key !== LibraryFilterKey.SortBy &&
      values[section.key] !== defaults[section.key],
  );

  const sortLabel = sections
    .find((section) => section.key === LibraryFilterKey.SortBy)
    ?.options.find(
      (option) => String(option.value) === values[LibraryFilterKey.SortBy],
    )?.label;

  const sortChanged =
    values[LibraryFilterKey.SortBy] !== defaults[LibraryFilterKey.SortBy];

  const hasAnyFilter = activeFilters.length > 0 || sortChanged;

  if (!hasAnyFilter) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.pills}>
        {sortChanged && sortLabel && (
          <div className={styles.pill} data-type="sort">
            <span>{`${t("sortBy")}: ${sortLabel}`}</span>
            <button
              type="button"
              className={styles.remove}
              onClick={() => onRemoveFilter(LibraryFilterKey.SortBy)}
              aria-label={`${t("remove")}: ${sortLabel}`}
            >
              <X aria-hidden="true" />
            </button>
          </div>
        )}
        {activeFilters.map((section) => {
          const option = section.options.find(
            (opt) => String(opt.value) === values[section.key],
          );
          const label = option?.label || values[section.key];
          return (
            <div key={section.key} className={styles.pill}>
              <span>{label}</span>
              <button
                type="button"
                className={styles.remove}
                onClick={() => onRemoveFilter(section.key)}
                aria-label={`${t("remove")}: ${label}`}
              >
                <X aria-hidden="true" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          className={styles.pill}
          onClick={onClearAll}
          aria-label={t("clearFilters")}
        >
          <X aria-hidden="true" />
          <span>{t("clearFilters")}</span>
        </button>
      </div>
    </div>
  );
}
