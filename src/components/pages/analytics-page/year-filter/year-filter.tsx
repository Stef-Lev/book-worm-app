"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Dropdown from "@/components/dropdown/dropdown";
import styles from "./year-filter.module.css";
import type { YearFilterProps } from "./year-filter.types";

export default function YearFilter({ year, years }: YearFilterProps) {
  const t = useTranslations("pages.analytics");
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeYear(value: string) {
    const params = new URLSearchParams(window.location.search);
    params.set("year", value);
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className={styles.filter} aria-busy={isPending}>
      <Dropdown
        id="analytics-year"
        name="year"
        label={t("showStatsFor")}
        fieldClassName={styles.field}
        size="sm"
        value={String(year)}
        onValueChange={changeYear}
        disabled={isPending}
        options={[
          { value: "all", label: t("allTime") },
          ...years.map((optionYear) => ({
            value: optionYear,
            label: String(optionYear),
          })),
        ]}
      />
    </div>
  );
}
