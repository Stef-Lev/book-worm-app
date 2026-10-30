import { useState } from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LibraryFilterKey } from "@/lib/library";
import { renderWithIntl, t } from "@/test/utils";
import type {
  LibraryFilterSection,
  LibraryFilterValues,
} from "@/components/book-library/library-filters-drawer/library-filters-drawer.types";
import LibraryFiltersSidebar from "./library-filters-sidebar";

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
      { value: "all", label: t("libraryWorkspace.allBooks"), count: 3 },
      { value: "read", label: t("libraryWorkspace.shelfRead"), count: 2 },
      {
        value: "dnf",
        label: t("libraryWorkspace.shelfDidNotFinish"),
        count: 0,
        disabled: true,
      },
    ],
  },
  {
    key: LibraryFilterKey.Author,
    label: t("libraryWorkspace.authors"),
    multiSelect: true,
    options: [
      { value: "Ursula K. Le Guin", label: "Ursula K. Le Guin", count: 2 },
      { value: "Octavia E. Butler", label: "Octavia E. Butler", count: 1 },
    ],
  },
];

function Harness({
  initialValues = defaults,
}: {
  initialValues?: LibraryFilterValues;
}) {
  const [values, setValues] = useState(initialValues);
  return (
    <LibraryFiltersSidebar
      values={values}
      defaults={defaults}
      sections={sections}
      onChange={(key, value) =>
        setValues((current) => ({ ...current, [key]: value }))
      }
      onClear={() => setValues(defaults)}
    />
  );
}

function getSection(label: string) {
  return screen
    .getAllByRole("group")
    .find((group) =>
      within(group).queryByText(label, { selector: "summary *" }),
    )!;
}

describe("LibraryFiltersSidebar", () => {
  it("should render a filters landmark labelled by its heading", () => {
    renderWithIntl(<Harness />);

    expect(
      screen.getByRole("complementary", { name: t("libraryWorkspace.filter") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      t("libraryWorkspace.filter"),
    );
  });

  it("should not show the reset button when values match the defaults", () => {
    renderWithIntl(<Harness />);

    expect(
      screen.queryByRole("button", { name: t("libraryWorkspace.reset") }),
    ).not.toBeInTheDocument();
  });

  it("should render a section for every filter", () => {
    renderWithIntl(<Harness />);

    expect(screen.getAllByRole("group")).toHaveLength(sections.length);
    expect(
      screen.getByRole("radiogroup", { name: t("libraryWorkspace.sortBy") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radiogroup", { name: t("libraryWorkspace.status") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /Ursula K. Le Guin/ }),
    ).toBeInTheDocument();
  });

  it("should expand only the sort and shelf sections by default", () => {
    renderWithIntl(<Harness />);

    expect(getSection(t("libraryWorkspace.sortBy"))).toHaveAttribute("open");
    expect(getSection(t("libraryWorkspace.status"))).toHaveAttribute("open");
    expect(getSection(t("libraryWorkspace.authors"))).not.toHaveAttribute(
      "open",
    );
  });

  it("should check the options matching the current values", () => {
    renderWithIntl(<Harness />);

    expect(
      screen.getByRole("radio", { name: t("libraryWorkspace.sortTitle") }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", {
        name: new RegExp(`^${t("libraryWorkspace.allBooks")}`),
      }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /Ursula K. Le Guin/ }),
    ).not.toBeChecked();
  });

  it("should show option counts next to their labels", () => {
    renderWithIntl(<Harness />);

    const statusGroup = screen.getByRole("radiogroup", {
      name: t("libraryWorkspace.status"),
    });
    expect(
      within(statusGroup).getByText(t("libraryWorkspace.shelfRead")),
    ).toHaveTextContent("2");
  });

  it("should disable options marked as disabled", () => {
    renderWithIntl(<Harness />);

    expect(
      screen.getByRole("radio", {
        name: new RegExp(t("libraryWorkspace.shelfDidNotFinish")),
      }),
    ).toBeDisabled();
  });

  it("should select a single-select option and show it as the active value", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.click(
      screen.getByRole("radio", { name: t("libraryWorkspace.sortRating") }),
    );

    expect(
      screen.getByRole("radio", { name: t("libraryWorkspace.sortRating") }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: t("libraryWorkspace.sortTitle") }),
    ).not.toBeChecked();
    expect(getSection(t("libraryWorkspace.sortBy"))).toHaveTextContent(
      `${t("libraryWorkspace.sortBy")}${t("libraryWorkspace.sortRating")}`,
    );
    expect(
      screen.getByRole("button", { name: t("libraryWorkspace.reset") }),
    ).toBeInTheDocument();
  });

  it("should toggle multi-select options", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    const leGuin = screen.getByRole("checkbox", { name: /Ursula K. Le Guin/ });
    const butler = screen.getByRole("checkbox", { name: /Octavia E. Butler/ });

    await user.click(leGuin);
    await user.click(butler);

    expect(leGuin).toBeChecked();
    expect(butler).toBeChecked();
    expect(
      screen.getByRole("button", { name: t("libraryWorkspace.reset") }),
    ).toBeInTheDocument();

    await user.click(leGuin);
    await user.click(butler);

    expect(leGuin).not.toBeChecked();
    expect(butler).not.toBeChecked();
    expect(
      screen.queryByRole("button", { name: t("libraryWorkspace.reset") }),
    ).not.toBeInTheDocument();
  });

  it("should show the reset button when initial values differ from the defaults", () => {
    renderWithIntl(
      <Harness
        initialValues={{ ...defaults, [LibraryFilterKey.Shelf]: "read" }}
      />,
    );

    expect(
      screen.getByRole("button", { name: t("libraryWorkspace.reset") }),
    ).toBeInTheDocument();
    expect(getSection(t("libraryWorkspace.status"))).toHaveTextContent(
      `${t("libraryWorkspace.status")}${t("libraryWorkspace.shelfRead")}`,
    );
  });

  it("should restore the default values when reset is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.click(
      screen.getByRole("radio", { name: t("libraryWorkspace.sortRating") }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: /Ursula K. Le Guin/ }),
    );
    await user.click(
      screen.getByRole("button", { name: t("libraryWorkspace.reset") }),
    );

    expect(
      screen.getByRole("radio", { name: t("libraryWorkspace.sortTitle") }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /Ursula K. Le Guin/ }),
    ).not.toBeChecked();
    expect(
      screen.queryByRole("button", { name: t("libraryWorkspace.reset") }),
    ).not.toBeInTheDocument();
  });
});
