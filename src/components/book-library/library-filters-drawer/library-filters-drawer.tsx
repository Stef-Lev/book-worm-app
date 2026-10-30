"use client";

import { useState } from "react";
import { Dialog } from "@ark-ui/react/dialog";
import DialogOverlay from "@/components/dialog-overlay/dialog-overlay";
import { Tabs } from "@ark-ui/react/tabs";
import { ArrowDownUp, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/button/button";
import IconButton from "@/components/icon-button/icon-button";
import FilterOptions from "@/components/book-library/filter-options/filter-options";
import { LibraryFilterKey } from "@/lib/library";
import { filterValuesEqual } from "@/components/book-library/filter-utils";
import type { LibraryFiltersDrawerProps } from "./library-filters-drawer.types";
import styles from "./library-filters-drawer.module.css";

export default function LibraryFiltersDrawer({
  values,
  defaults,
  sections,
  onApply,
  disabled,
  resultCount,
  getResultCount,
}: LibraryFiltersDrawerProps) {
  const t = useTranslations("libraryWorkspace");
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<LibraryFilterKey>(
    LibraryFilterKey.SortBy,
  );
  const [draft, setDraft] = useState(values);

  const draftResultCount = getResultCount ? getResultCount(draft) : resultCount;

  const activeFilterCount = sections.filter(
    (section) =>
      section.key !== LibraryFilterKey.SortBy &&
      !filterValuesEqual(values[section.key], defaults[section.key]),
  ).length;
  const sortLabel = sections
    .find((section) => section.key === LibraryFilterKey.SortBy)
    ?.options.find(
      (option) => String(option.value) === values[LibraryFilterKey.SortBy],
    )?.label;
  const firstFilterSection =
    sections.find((section) => section.key !== LibraryFilterKey.SortBy)?.key ??
    LibraryFilterKey.SortBy;

  const sortChanged =
    values[LibraryFilterKey.SortBy] !== defaults[LibraryFilterKey.SortBy];

  function openDrawer(section: LibraryFilterKey) {
    setDraft(values);
    setActiveSection(section);
    setOpen(true);
  }

  return (
    <>
      <div className={styles.pills}>
        <button
          type="button"
          className={styles.pill}
          data-active={activeFilterCount > 0 || undefined}
          disabled={disabled}
          aria-haspopup="dialog"
          onClick={() => openDrawer(firstFilterSection)}
        >
          {t("filter")}
          {activeFilterCount > 0 && (
            <span className={styles.count}>{activeFilterCount}</span>
          )}
          <SlidersHorizontal aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.pill}
          data-active={sortChanged || undefined}
          disabled={disabled}
          aria-haspopup="dialog"
          onClick={() => openDrawer(LibraryFilterKey.SortBy)}
        >
          {sortChanged && sortLabel
            ? `${t("sortBy")}: ${sortLabel}`
            : t("sortBy")}
          <ChevronDown aria-hidden="true" />
        </button>
      </div>
      <Dialog.Root
        open={open}
        onOpenChange={({ open }) => setOpen(open)}
        lazyMount
        unmountOnExit
      >
        <DialogOverlay placement="bottom">
          <Dialog.Content className={styles.drawer}>
            <div className={styles.header}>
              <Dialog.Title className={styles.title}>
                {t("filter")}
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton label={t("close")}>
                  <X aria-hidden="true" />
                </IconButton>
              </Dialog.CloseTrigger>
            </div>
            <Tabs.Root
              className={styles.body}
              orientation="vertical"
              value={activeSection}
              onValueChange={({ value }) => {
                const section = sections.find(({ key }) => key === value);
                if (section) setActiveSection(section.key);
              }}
            >
              <Tabs.List className={styles.tabList}>
                {sections.map((section) => (
                  <Tabs.Trigger
                    key={section.key}
                    value={section.key}
                    className={styles.tab}
                  >
                    {section.key === LibraryFilterKey.SortBy ? (
                      <ArrowDownUp aria-hidden="true" />
                    ) : (
                      !filterValuesEqual(draft[section.key], defaults[section.key]) && (
                        <span className={styles.dot} aria-hidden="true" />
                      )
                    )}
                    {section.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
              {sections.map((section) => (
                <Tabs.Content
                  key={section.key}
                  value={section.key}
                  className={styles.panel}
                >
                  <FilterOptions
                    section={section}
                    value={draft[section.key]}
                    onValueChange={(value) =>
                      setDraft((previous) => ({
                        ...previous,
                        [section.key]: value,
                      }))
                    }
                  />
                </Tabs.Content>
              ))}
            </Tabs.Root>
            <div className={styles.footer}>
              <Button variant="secondary" onClick={() => setDraft(defaults)}>
                {t("clearFilters")}
              </Button>
              <Button
                onClick={() => {
                  onApply(draft);
                  setOpen(false);
                }}
              >
                {t("apply")}
                {draftResultCount !== undefined && (
                  <span className={styles.resultCount}>{draftResultCount}</span>
                )}
              </Button>
            </div>
          </Dialog.Content>
        </DialogOverlay>
      </Dialog.Root>
    </>
  );
}
