import { afterEach, describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setPathname, testRouter } from "@/test/navigation";
import { renderWithIntl, t } from "@/test/utils";
import YearFilter from "./year-filter";

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

function getYearSelect() {
  return screen.getByRole("combobox", {
    name: t("pages.analytics.showStatsFor"),
  });
}

describe("YearFilter", () => {
  it("should show the selected year", () => {
    renderWithIntl(<YearFilter year={2025} years={[2026, 2025, 2024]} />);

    expect(getYearSelect()).toHaveTextContent("2025");
  });

  it("should show the all time label when all years are selected", () => {
    renderWithIntl(<YearFilter year="all" years={[2026, 2025]} />);

    expect(getYearSelect()).toHaveTextContent(t("pages.analytics.allTime"));
  });

  it("should offer all time followed by every available year", async () => {
    const user = userEvent.setup();
    renderWithIntl(<YearFilter year={2026} years={[2026, 2025, 2024]} />);

    await user.click(getYearSelect());

    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent(t("pages.analytics.allTime"));
    expect(options[1]).toHaveTextContent("2026");
    expect(options[2]).toHaveTextContent("2025");
    expect(options[3]).toHaveTextContent("2024");
  });

  it("should navigate to the chosen year without scrolling", async () => {
    const user = userEvent.setup();
    setPathname("/analytics");
    renderWithIntl(<YearFilter year={2026} years={[2026, 2025, 2024]} />);

    await user.click(getYearSelect());
    await user.click(screen.getByRole("option", { name: "2024" }));

    expect(testRouter.push).toHaveBeenCalledWith("/analytics?year=2024", {
      scroll: false,
    });
  });

  it("should keep other query params when choosing all time", async () => {
    const user = userEvent.setup();
    setPathname("/analytics");
    window.history.replaceState(null, "", "/analytics?tab=summary&year=2025");
    renderWithIntl(<YearFilter year={2025} years={[2026, 2025]} />);

    await user.click(getYearSelect());
    await user.click(
      screen.getByRole("option", { name: t("pages.analytics.allTime") }),
    );

    expect(testRouter.push).toHaveBeenCalledWith(
      "/analytics?tab=summary&year=all",
      { scroll: false },
    );
  });

  it("should submit the selected year through a hidden year field", () => {
    renderWithIntl(
      <form aria-label="filters">
        <YearFilter year={2025} years={[2026, 2025]} />
      </form>,
    );

    expect(screen.getByRole("form", { name: "filters" })).toHaveFormValues({
      year: "2025",
    });
  });
});
