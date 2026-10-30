import { useState } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LibraryFilterKey } from "@/lib/library";
import { renderWithIntl, t } from "@/test/utils";
import type {
  LibraryFilterSection,
  LibraryFilterValues,
} from "./library-filters-drawer.types";
import LibraryFiltersDrawer from "./library-filters-drawer";

const defaults: LibraryFilterValues = {
  [LibraryFilterKey.SortBy]: "title",
  [LibraryFilterKey.Shelf]: "all",
  [LibraryFilterKey.Author]: [],
  [LibraryFilterKey.Category]: [],
  [LibraryFilterKey.Collection]: [],
};

const books = [
  { shelf: "read", author: "Ursula K. Le Guin" },
  { shelf: "read", author: "Octavia E. Butler" },
  { shelf: "to-read", author: "Ursula K. Le Guin" },
];

function countBooks(filters: LibraryFilterValues) {
  const authors = filters[LibraryFilterKey.Author] as string[];
  return books.filter(
    (book) =>
      (filters[LibraryFilterKey.Shelf] === "all" ||
        book.shelf === filters[LibraryFilterKey.Shelf]) &&
      (!authors.length || authors.includes(book.author)),
  ).length;
}

const sections: LibraryFilterSection[] = [
  {
    key: LibraryFilterKey.SortBy,
    label: t("libraryWorkspace.sortBy"),
    options: [
      { value: "title", label: t("libraryWorkspace.sortTitle") },
      { value: "rating", label: t("libraryWorkspace.sortRating") },
    ],
  },
  {
    key: LibraryFilterKey.Shelf,
    label: t("libraryWorkspace.status"),
    options: [
      { value: "all", label: t("libraryWorkspace.allBooks") },
      { value: "read", label: t("libraryWorkspace.shelfRead") },
      { value: "to-read", label: t("libraryWorkspace.shelfToRead") },
    ],
  },
  {
    key: LibraryFilterKey.Author,
    label: t("libraryWorkspace.authors"),
    multiSelect: true,
    options: [
      { value: "Ursula K. Le Guin", label: "Ursula K. Le Guin" },
      { value: "Octavia E. Butler", label: "Octavia E. Butler" },
    ],
  },
];

function Harness({
  initialValues = defaults,
  disabled,
  withCounter = true,
  resultCount,
}: {
  initialValues?: LibraryFilterValues;
  disabled?: boolean;
  withCounter?: boolean;
  resultCount?: number;
}) {
  const [values, setValues] = useState(initialValues);
  return (
    <LibraryFiltersDrawer
      values={values}
      defaults={defaults}
      sections={sections}
      onApply={setValues}
      disabled={disabled}
      resultCount={resultCount}
      getResultCount={withCounter ? countBooks : undefined}
    />
  );
}

const filterPill = () =>
  screen.getByRole("button", {
    name: new RegExp(`^${t("libraryWorkspace.filter")}`),
  });
const sortPill = () =>
  screen.getByRole("button", {
    name: new RegExp(`^${t("libraryWorkspace.sortBy")}`),
  });
const applyButton = () =>
  screen.getByRole("button", {
    name: new RegExp(`^${t("libraryWorkspace.apply")}`),
  });

async function closeDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: t("libraryWorkspace.close") }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
}

describe("LibraryFiltersDrawer", () => {
  it("should render the filter and sort pills without opening the drawer", () => {
    renderWithIntl(<Harness />);

    expect(filterPill()).toHaveTextContent(
      new RegExp(`^${t("libraryWorkspace.filter")}$`),
    );
    expect(sortPill()).toHaveTextContent(
      new RegExp(`^${t("libraryWorkspace.sortBy")}$`),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should disable both pills when disabled", () => {
    renderWithIntl(<Harness disabled />);

    expect(filterPill()).toBeDisabled();
    expect(sortPill()).toBeDisabled();
  });

  it("should show the active filter count and sort label from the applied values", () => {
    renderWithIntl(
      <Harness
        initialValues={{
          ...defaults,
          [LibraryFilterKey.SortBy]: "rating",
          [LibraryFilterKey.Shelf]: "read",
          [LibraryFilterKey.Author]: ["Octavia E. Butler"],
        }}
      />,
    );

    expect(filterPill()).toHaveTextContent(`${t("libraryWorkspace.filter")}2`);
    expect(sortPill()).toHaveTextContent(
      `${t("libraryWorkspace.sortBy")}: ${t("libraryWorkspace.sortRating")}`,
    );
  });

  it("should open the drawer on the first filter section from the filter pill", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.click(filterPill());

    const dialog = await screen.findByRole("dialog", {
      name: t("libraryWorkspace.filter"),
    });
    expect(
      within(dialog).getByRole("tab", { name: t("libraryWorkspace.status") }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      within(dialog).getByRole("radiogroup", {
        name: t("libraryWorkspace.status"),
      }),
    ).toBeInTheDocument();
  });

  it("should open the drawer on the sort section from the sort pill", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.click(sortPill());

    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("tab", { name: t("libraryWorkspace.sortBy") }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      within(dialog).getByRole("radio", {
        name: t("libraryWorkspace.sortTitle"),
      }),
    ).toBeChecked();
  });

  it("should switch sections when another tab is selected", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.click(filterPill());
    await user.click(
      await screen.findByRole("tab", { name: t("libraryWorkspace.authors") }),
    );

    expect(
      screen.getByRole("tab", { name: t("libraryWorkspace.authors") }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("checkbox", { name: "Ursula K. Le Guin" }),
    ).toBeInTheDocument();
  });

  it("should update the result count on the apply button as the draft changes", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.click(filterPill());
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(applyButton()).toHaveTextContent(`${t("libraryWorkspace.apply")}3`);

    await user.click(
      screen.getByRole("radio", { name: t("libraryWorkspace.shelfRead") }),
    );

    expect(applyButton()).toHaveTextContent(`${t("libraryWorkspace.apply")}2`);
  });

  it("should show the static result count when no counter is provided", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness withCounter={false} resultCount={7} />);

    await user.click(filterPill());
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    expect(applyButton()).toHaveTextContent(`${t("libraryWorkspace.apply")}7`);
  });

  it("should apply the draft and close the drawer when apply is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.click(filterPill());
    await user.click(
      await screen.findByRole("radio", {
        name: t("libraryWorkspace.shelfRead"),
      }),
    );
    await user.click(
      screen.getByRole("tab", { name: t("libraryWorkspace.sortBy") }),
    );
    await user.click(
      screen.getByRole("radio", { name: t("libraryWorkspace.sortRating") }),
    );
    await user.click(applyButton());

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(filterPill()).toHaveTextContent(`${t("libraryWorkspace.filter")}1`);
    expect(sortPill()).toHaveTextContent(
      `${t("libraryWorkspace.sortBy")}: ${t("libraryWorkspace.sortRating")}`,
    );
  });

  it("should discard the draft when the drawer is closed without applying", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.click(filterPill());
    await user.click(
      await screen.findByRole("radio", {
        name: t("libraryWorkspace.shelfRead"),
      }),
    );
    await closeDialog(user);

    expect(filterPill()).toHaveTextContent(
      new RegExp(`^${t("libraryWorkspace.filter")}$`),
    );

    await user.click(filterPill());

    expect(
      await screen.findByRole("radio", {
        name: t("libraryWorkspace.allBooks"),
      }),
    ).toBeChecked();
  });

  it("should reset the draft to the defaults when clear filters is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Harness
        initialValues={{ ...defaults, [LibraryFilterKey.Shelf]: "read" }}
      />,
    );

    await user.click(filterPill());
    expect(
      await screen.findByRole("radio", {
        name: t("libraryWorkspace.shelfRead"),
      }),
    ).toBeChecked();

    await user.click(
      screen.getByRole("button", { name: t("libraryWorkspace.clearFilters") }),
    );

    expect(
      screen.getByRole("radio", { name: t("libraryWorkspace.allBooks") }),
    ).toBeChecked();
    expect(applyButton()).toHaveTextContent(`${t("libraryWorkspace.apply")}3`);

    await user.click(applyButton());

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(filterPill()).toHaveTextContent(
      new RegExp(`^${t("libraryWorkspace.filter")}$`),
    );
  });
});
