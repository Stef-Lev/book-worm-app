"use client";

import { useState } from "react";
import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { Tabs } from "@ark-ui/react/tabs";
import { ArrowDownUp, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import Button from "@/components/button/button";
import IconButton from "@/components/icon-button/icon-button";
import FilterOptions from "@/components/book-library/filter-options/filter-options";
import type {
  LibraryFilterKey,
  LibraryFiltersDrawerProps,
} from "./library-filters-drawer.types";
import styles from "./library-filters-drawer.module.css";

export default function LibraryFiltersDrawer({
  values,
  defaults,
  sections,
  onApply,
  disabled,
}: LibraryFiltersDrawerProps) {
  const t = useTranslations("libraryWorkspace");
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<LibraryFilterKey>("sortBy");
  const [draft, setDraft] = useState(values);

  const activeFilterCount = sections.filter(
    (section) =>
      section.key !== "sortBy" && values[section.key] !== defaults[section.key],
  ).length;
  const sortLabel = sections
    .find((section) => section.key === "sortBy")
    ?.options.find((option) => String(option.value) === values.sortBy)?.label;
  const firstFilterSection =
    sections.find((section) => section.key !== "sortBy")?.key ?? "sortBy";

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
          data-active={values.sortBy !== defaults.sortBy || undefined}
          disabled={disabled}
          aria-haspopup="dialog"
          onClick={() => openDrawer("sortBy")}
        >
          {values.sortBy !== defaults.sortBy && sortLabel
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
        <Portal>
          <Dialog.Backdrop className={styles.backdrop} />
          <Dialog.Positioner className={styles.positioner}>
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
                      {section.key === "sortBy" ? (
                        <ArrowDownUp aria-hidden="true" />
                      ) : (
                        draft[section.key] !== defaults[section.key] && (
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
                </Button>
              </div>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
