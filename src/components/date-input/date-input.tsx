"use client";

import { DatePicker, parseDate } from "@ark-ui/react/date-picker";
import { Portal } from "@ark-ui/react/portal";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatInputDate, parseInputDate } from "./date-input.utils";
import IconButton from "@/components/icon-button/icon-button";
import { cn } from "@/lib/cn";
import styles from "./date-input.module.css";
import type { DateInputProps } from "./date-input.types";

export default function DateInput({
  label,
  value,
  onValueChange,
  fieldClassName,
  disabled,
}: DateInputProps) {
  const locale = useLocale();
  const t = useTranslations("dateInput");

  return (
    <DatePicker.Root
      className={cn(styles.field, fieldClassName)}
      locale={locale}
      timeZone="UTC"
      value={value ? [parseDate(value)] : []}
      onValueChange={({ value: dates }) => onValueChange(dates[0]?.toString() ?? "")}
      format={formatInputDate}
      parse={parseInputDate}
      disabled={disabled}
      openOnClick
      positioning={{ placement: "bottom-start" }}
      translations={{
        trigger: () => t("chooseDate"),
        clearTrigger: t("clear"),
        content: label,
        prevTrigger: () => t("previous"),
        nextTrigger: () => t("next"),
        viewTrigger: () => t("changeView"),
      }}
    >
      <DatePicker.Label className={styles.label}>{label}</DatePicker.Label>
      <DatePicker.Control className={styles.control}>
        <DatePicker.Input className={styles.input} placeholder={t("placeholder")} />
        <CalendarDays className={styles.calendarIcon} aria-hidden="true" />
      </DatePicker.Control>
      <Portal>
        <DatePicker.Positioner className={styles.positioner}>
          <DatePicker.Content className={styles.content}>
            {(["day", "month", "year"] as const).map((view) => (
              <DatePicker.View key={view} view={view}>
                <DatePicker.Context>
                  {(datePicker) => (
                    <>
                      <DatePicker.ViewControl className={styles.navigation}>
                        <DatePicker.PrevTrigger asChild>
                          <IconButton label={t("previous")}>
                            <ChevronLeft aria-hidden="true" />
                          </IconButton>
                        </DatePicker.PrevTrigger>
                        <DatePicker.ViewTrigger className={styles.viewTrigger}>
                          <DatePicker.RangeText />
                        </DatePicker.ViewTrigger>
                        <DatePicker.NextTrigger asChild>
                          <IconButton label={t("next")}>
                            <ChevronRight aria-hidden="true" />
                          </IconButton>
                        </DatePicker.NextTrigger>
                      </DatePicker.ViewControl>
                      <DatePicker.Table
                        className={styles.table}
                        columns={view === "day" ? 7 : 3}
                      >
                        {view === "day" && (
                          <DatePicker.TableHead>
                            <DatePicker.TableRow>
                              {datePicker.weekDays.map((day, index) => (
                                <DatePicker.TableHeader
                                  key={index}
                                  className={styles.weekday}
                                >
                                  {day.short}
                                </DatePicker.TableHeader>
                              ))}
                            </DatePicker.TableRow>
                          </DatePicker.TableHead>
                        )}
                        <DatePicker.TableBody>
                          {view === "day"
                            ? datePicker.weeks.map((week, index) => (
                                <DatePicker.TableRow key={index}>
                                  {week.map((day) => (
                                    <DatePicker.TableCell key={day.toString()} value={day}>
                                      <DatePicker.TableCellTrigger className={styles.day}>
                                        {day.day}
                                      </DatePicker.TableCellTrigger>
                                    </DatePicker.TableCell>
                                  ))}
                                </DatePicker.TableRow>
                              ))
                            : (view === "month"
                                ? datePicker.getMonthsGrid({ columns: 3, format: "short" })
                                : datePicker.getYearsGrid({ columns: 3 })
                              ).map((row, index) => (
                                <DatePicker.TableRow key={index}>
                                  {row.map((item) => (
                                    <DatePicker.TableCell key={item.value} value={item.value}>
                                      <DatePicker.TableCellTrigger className={styles.period}>
                                        {item.label}
                                      </DatePicker.TableCellTrigger>
                                    </DatePicker.TableCell>
                                  ))}
                                </DatePicker.TableRow>
                              ))}
                        </DatePicker.TableBody>
                      </DatePicker.Table>
                    </>
                  )}
                </DatePicker.Context>
              </DatePicker.View>
            ))}
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
}
