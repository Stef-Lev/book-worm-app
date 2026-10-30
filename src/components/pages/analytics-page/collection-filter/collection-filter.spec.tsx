import { describe, expect, it } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl, t } from "@/test/utils";
import type { CollectionStats } from "./collection-filter.types";
import CollectionFilter from "./collection-filter";

const collections: CollectionStats[] = [
  { id: "c1", name: "Classics", total: 4, read: 3, percentage: 75 },
  { id: "c2", name: "Sci-Fi", total: 1, read: 0, percentage: 0 },
  { id: "c3", name: "Empty shelf", total: 0, read: 0, percentage: 0 },
];

function getMetric() {
  return screen
    .getByText(t("pages.analytics.libraryReadPercentageAllTime"))
    .closest("article")!;
}

async function selectCollection(name: string) {
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("combobox", { name: t("pages.analytics.byCollection") }),
  );
  await user.click(screen.getByRole("option", { name }));
}

describe("CollectionFilter", () => {
  it("should show the aggregated read percentage across all collections by default", () => {
    renderWithIntl(<CollectionFilter collections={collections} />);

    expect(
      screen.getByRole("combobox", { name: t("pages.analytics.byCollection") }),
    ).toHaveTextContent(t("pages.analytics.allCollections"));
    expect(getMetric()).toHaveTextContent("60%");
    expect(getMetric()).toHaveTextContent("3 of 5 books");
  });

  it("should list every collection as an option", async () => {
    const user = userEvent.setup();
    renderWithIntl(<CollectionFilter collections={collections} />);

    await user.click(
      screen.getByRole("combobox", { name: t("pages.analytics.byCollection") }),
    );

    const options = within(screen.getByRole("listbox")).getAllByRole("option");
    expect(options).toHaveLength(4);
    expect(options[0]).toHaveTextContent(t("pages.analytics.allCollections"));
    expect(options[1]).toHaveTextContent("Classics");
    expect(options[2]).toHaveTextContent("Sci-Fi");
    expect(options[3]).toHaveTextContent("Empty shelf");
  });

  it("should show the stats of the selected collection", async () => {
    renderWithIntl(<CollectionFilter collections={collections} />);

    await selectCollection("Classics");

    expect(
      screen.getByRole("combobox", { name: t("pages.analytics.byCollection") }),
    ).toHaveTextContent("Classics");
    expect(getMetric()).toHaveTextContent("75%");
    expect(getMetric()).toHaveTextContent("3 of 4 books");
  });

  it("should use the singular book label for a collection with one book", async () => {
    renderWithIntl(<CollectionFilter collections={collections} />);

    await selectCollection("Sci-Fi");

    expect(getMetric()).toHaveTextContent("0%");
    expect(getMetric()).toHaveTextContent("0 of 1 book");
  });

  it("should show zero percent for an empty collection", async () => {
    renderWithIntl(<CollectionFilter collections={collections} />);

    await selectCollection("Empty shelf");

    expect(getMetric()).toHaveTextContent("0%");
    expect(getMetric()).toHaveTextContent("0 of 0 books");
  });

  it("should go back to the aggregated stats when all collections is selected again", async () => {
    renderWithIntl(<CollectionFilter collections={collections} />);

    await selectCollection("Sci-Fi");
    await selectCollection(t("pages.analytics.allCollections"));

    expect(getMetric()).toHaveTextContent("60%");
    expect(getMetric()).toHaveTextContent("3 of 5 books");
  });

  it("should show zero percent when there are no collections", () => {
    renderWithIntl(<CollectionFilter collections={[]} />);

    expect(getMetric()).toHaveTextContent("0%");
    expect(getMetric()).toHaveTextContent("0 of 0 books");
  });
});
