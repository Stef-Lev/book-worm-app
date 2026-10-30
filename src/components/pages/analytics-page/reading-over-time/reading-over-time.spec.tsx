import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl, t } from "@/test/utils";
import type { ReadingOverTimeProps } from "./reading-over-time.types";
import ReadingOverTime from "./reading-over-time";

const months: ReadingOverTimeProps["months"] = [
  { year: 2024, label: "Nov", count: 1 },
  { year: 2024, label: "Dec", count: 2 },
  { year: 2025, label: "Jan", count: 3 },
  { year: 2025, label: "Feb", count: 0 },
  { year: 2025, label: "Mar", count: 1 },
];

describe("ReadingOverTime", () => {
  it("should render the heading and the monthly description for a specific year", async () => {
    renderWithIntl(await ReadingOverTime({ months, year: 2025 }));

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      t("pages.analytics.readingOverTime"),
    );
    expect(
      screen.getByText(
        t("pages.analytics.monthlyCompletions", { period: "2025" }),
      ),
    ).toBeInTheDocument();
  });

  it("should only show months of the selected year with their completion counts", async () => {
    renderWithIntl(await ReadingOverTime({ months, year: 2025 }));

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Jan3");
    expect(items[1]).toHaveTextContent("Feb0");
    expect(items[2]).toHaveTextContent("Mar1");

    const january = screen.getByRole("progressbar", {
      name: t("pages.analytics.periodCompletionCount", {
        period: "Jan 2025",
        count: 3,
      }),
    });
    expect(january).toHaveAttribute("value", "3");
    expect(january).toHaveAttribute("max", "3");
    expect(
      screen.queryByText(t("pages.analytics.noCompletions")),
    ).not.toBeInTheDocument();
  });

  it("should aggregate completions per year when showing all time", async () => {
    renderWithIntl(await ReadingOverTime({ months, year: "all" }));

    expect(
      screen.getByText(t("pages.analytics.yearlyCompletions")),
    ).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("20243");
    expect(items[1]).toHaveTextContent("20254");

    const year2024 = screen.getByRole("progressbar", {
      name: t("pages.analytics.periodCompletionCount", {
        period: "2024",
        count: 3,
      }),
    });
    expect(year2024).toHaveAttribute("value", "3");
    expect(year2024).toHaveAttribute("max", "4");
  });

  it("should show the empty message when nothing was finished in the period", async () => {
    renderWithIntl(
      await ReadingOverTime({
        months: [
          { year: 2025, label: "Jan", count: 0 },
          { year: 2025, label: "Feb", count: 0 },
        ],
        year: 2025,
      }),
    );

    expect(
      screen.getByText(t("pages.analytics.noCompletions")),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
  });

  it("should show the empty message when the selected year has no months", async () => {
    renderWithIntl(await ReadingOverTime({ months, year: 2020 }));

    expect(
      screen.getByText(t("pages.analytics.noCompletions")),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
