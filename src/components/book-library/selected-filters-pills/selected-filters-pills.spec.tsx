import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LibraryFilterKey } from "@/lib/library";
import { renderWithIntl, t } from "@/test/utils";
import type {
  LibraryFilterSection,
  LibraryFilterValues,
} from "@/components/book-library/library-filters-drawer/library-filters-drawer.types";
import SelectedFiltersPills from "./selected-filters-pills";

const defaults: LibraryFilterValues = {
  [LibraryFilterKey.SortBy]: "title",
  [LibraryFilterKey.Shelf]: "all",
  [LibraryFilterKey.Author]: [],
  [LibraryFilterKey.Category]: [],
  [LibraryFilterKey.Collection]: [],
};

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
  {
    key: LibraryFilterKey.Collection,
    label: t("libraryWorkspace.collections"),
    multiSelect: true,
    options: [{ value: "c1", label: "Favourites" }],
  },
];

function Harness({
  initialValues,
  removeSingleValues = true,
}: {
  initialValues: LibraryFilterValues;
  removeSingleValues?: boolean;
}) {
  const [values, setValues] = useState(initialValues);
  return (
    <SelectedFiltersPills
      values={values}
      defaults={defaults}
      sections={sections}
      onRemoveFilter={(key) =>
        setValues((current) => ({ ...current, [key]: defaults[key] }))
      }
      onRemoveFilterValue={
        removeSingleValues
          ? (key, value) =>
              setValues((current) => ({
                ...current,
                [key]: (current[key] as string[]).filter(
                  (item) => item !== value,
                ),
              }))
          : undefined
      }
      onClearAll={() => setValues(defaults)}
    />
  );
}

const removeLabel = (label: string) => `${t("libraryWorkspace.remove")}: ${label}`;
const clearButton = () =>
  screen.queryByRole("button", { name: t("libraryWorkspace.clearFilters") });

describe("SelectedFiltersPills", () => {
  it("should render nothing when values match the defaults", () => {
    renderWithIntl(<Harness initialValues={defaults} />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("should render a sort pill when the sort differs from the default", () => {
    renderWithIntl(
      <Harness
        initialValues={{ ...defaults, [LibraryFilterKey.SortBy]: "rating" }}
      />,
    );

    expect(
      screen.getByText(
        `${t("libraryWorkspace.sortBy")}: ${t("libraryWorkspace.sortRating")}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: removeLabel(t("libraryWorkspace.sortRating")),
      }),
    ).toBeInTheDocument();
    expect(clearButton()).toBeInTheDocument();
  });

  it("should render a pill per active single and multi-select value", () => {
    renderWithIntl(
      <Harness
        initialValues={{
          ...defaults,
          [LibraryFilterKey.Shelf]: "read",
          [LibraryFilterKey.Author]: ["Ursula K. Le Guin", "Octavia E. Butler"],
        }}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: removeLabel(t("libraryWorkspace.shelfRead")),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: removeLabel("Ursula K. Le Guin") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: removeLabel("Octavia E. Butler") }),
    ).toBeInTheDocument();
  });

  it("should parse comma separated multi-select values", () => {
    renderWithIntl(
      <Harness
        initialValues={{
          ...defaults,
          [LibraryFilterKey.Author]: "Ursula K. Le Guin,Octavia E. Butler",
        }}
      />,
    );

    expect(screen.getByText("Ursula K. Le Guin")).toBeInTheDocument();
    expect(screen.getByText("Octavia E. Butler")).toBeInTheDocument();
  });

  it("should fall back to the raw value when no option matches", () => {
    renderWithIntl(
      <Harness
        initialValues={{ ...defaults, [LibraryFilterKey.Collection]: ["gone"] }}
      />,
    );

    expect(
      screen.getByRole("button", { name: removeLabel("gone") }),
    ).toBeInTheDocument();
  });

  it("should remove a single-select filter when its pill is removed", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Harness
        initialValues={{
          ...defaults,
          [LibraryFilterKey.Shelf]: "read",
          [LibraryFilterKey.Author]: ["Ursula K. Le Guin"],
        }}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: removeLabel(t("libraryWorkspace.shelfRead")),
      }),
    );

    expect(
      screen.queryByText(t("libraryWorkspace.shelfRead")),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Ursula K. Le Guin")).toBeInTheDocument();
  });

  it("should remove only the clicked multi-select value", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Harness
        initialValues={{
          ...defaults,
          [LibraryFilterKey.Author]: ["Ursula K. Le Guin", "Octavia E. Butler"],
        }}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: removeLabel("Ursula K. Le Guin") }),
    );

    expect(screen.queryByText("Ursula K. Le Guin")).not.toBeInTheDocument();
    expect(screen.getByText("Octavia E. Butler")).toBeInTheDocument();
  });

  it("should remove the whole multi-select filter when no value handler is provided", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Harness
        removeSingleValues={false}
        initialValues={{
          ...defaults,
          [LibraryFilterKey.Author]: ["Ursula K. Le Guin", "Octavia E. Butler"],
        }}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: removeLabel("Ursula K. Le Guin") }),
    );

    expect(screen.queryByText("Ursula K. Le Guin")).not.toBeInTheDocument();
    expect(screen.queryByText("Octavia E. Butler")).not.toBeInTheDocument();
    expect(clearButton()).not.toBeInTheDocument();
  });

  it("should reset the sort when the sort pill is removed", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Harness
        initialValues={{ ...defaults, [LibraryFilterKey.SortBy]: "rating" }}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: removeLabel(t("libraryWorkspace.sortRating")),
      }),
    );

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("should remove every pill when clear filters is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Harness
        initialValues={{
          ...defaults,
          [LibraryFilterKey.SortBy]: "rating",
          [LibraryFilterKey.Shelf]: "read",
          [LibraryFilterKey.Collection]: ["c1"],
        }}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(4);

    await user.click(clearButton()!);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
