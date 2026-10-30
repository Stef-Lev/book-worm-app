import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LibraryFilterKey } from "@/lib/library";
import { renderWithIntl, t } from "@/test/utils";
import type { LibraryFilterSection } from "@/components/book-library/library-filters-drawer/library-filters-drawer.types";
import FilterOptions from "./filter-options";

const shelfSection: LibraryFilterSection = {
  key: LibraryFilterKey.Shelf,
  label: t("libraryWorkspace.status"),
  options: [
    { value: "all", label: t("libraryWorkspace.allBooks"), count: 3 },
    { value: "read", label: t("libraryWorkspace.shelfRead"), count: 2 },
    {
      value: "did-not-finish",
      label: t("libraryWorkspace.shelfDidNotFinish"),
      count: 0,
      disabled: true,
    },
  ],
};

const authorSection: LibraryFilterSection = {
  key: LibraryFilterKey.Author,
  label: t("libraryWorkspace.authors"),
  multiSelect: true,
  options: [
    { value: "Ursula K. Le Guin", label: "Ursula K. Le Guin", count: 2 },
    { value: "Octavia E. Butler", label: "Octavia E. Butler", count: 1 },
    { value: "N. K. Jemisin", label: "N. K. Jemisin", disabled: true },
  ],
};

function Harness({
  section,
  initialValue,
  hideLabel,
}: {
  section: LibraryFilterSection;
  initialValue: string | string[];
  hideLabel?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <FilterOptions
        section={section}
        value={value}
        onValueChange={setValue}
        hideLabel={hideLabel}
      />
      <output aria-label="current value">
        {Array.isArray(value) ? value.join("|") : value}
      </output>
    </>
  );
}

describe("FilterOptions", () => {
  describe("single select", () => {
    it("should render a radio group labelled by the section label", () => {
      renderWithIntl(<Harness section={shelfSection} initialValue="all" />);

      expect(
        screen.getByRole("radiogroup", { name: t("libraryWorkspace.status") }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("radio")).toHaveLength(3);
    });

    it("should check the radio matching the current value", () => {
      renderWithIntl(<Harness section={shelfSection} initialValue="read" />);

      expect(
        screen.getByRole("radio", {
          name: new RegExp(`^${t("libraryWorkspace.shelfRead")}`),
        }),
      ).toBeChecked();
      expect(
        screen.getByRole("radio", {
          name: new RegExp(`^${t("libraryWorkspace.allBooks")}`),
        }),
      ).not.toBeChecked();
    });

    it("should render option counts next to the labels", () => {
      renderWithIntl(<Harness section={shelfSection} initialValue="all" />);

      expect(
        screen.getByText(t("libraryWorkspace.allBooks")),
      ).toHaveTextContent(`${t("libraryWorkspace.allBooks")}3`);
    });

    it("should disable options marked as disabled", () => {
      renderWithIntl(<Harness section={shelfSection} initialValue="all" />);

      expect(
        screen.getByRole("radio", {
          name: new RegExp(t("libraryWorkspace.shelfDidNotFinish")),
        }),
      ).toBeDisabled();
    });

    it("should select another option when clicked", async () => {
      const user = userEvent.setup();
      renderWithIntl(<Harness section={shelfSection} initialValue="all" />);

      await user.click(
        screen.getByRole("radio", {
          name: new RegExp(`^${t("libraryWorkspace.shelfRead")}`),
        }),
      );

      expect(
        screen.getByRole("radio", {
          name: new RegExp(`^${t("libraryWorkspace.shelfRead")}`),
        }),
      ).toBeChecked();
      expect(
        screen.getByRole("radio", {
          name: new RegExp(`^${t("libraryWorkspace.allBooks")}`),
        }),
      ).not.toBeChecked();
      expect(
        screen.getByRole("status", { name: "current value" }),
      ).toHaveTextContent("read");
    });

    it("should not select a disabled option when clicked", async () => {
      const user = userEvent.setup();
      renderWithIntl(<Harness section={shelfSection} initialValue="all" />);

      await user.click(
        screen.getByText(t("libraryWorkspace.shelfDidNotFinish")),
      );

      expect(
        screen.getByRole("radio", {
          name: new RegExp(t("libraryWorkspace.shelfDidNotFinish")),
        }),
      ).not.toBeChecked();
      expect(
        screen.getByRole("status", { name: "current value" }),
      ).toHaveTextContent("all");
    });

    it("should keep the label accessible when it is visually hidden", () => {
      renderWithIntl(
        <Harness section={shelfSection} initialValue="all" hideLabel />,
      );

      expect(
        screen.getByRole("radiogroup", { name: t("libraryWorkspace.status") }),
      ).toBeInTheDocument();
    });
  });

  describe("multi select", () => {
    it("should render a checkbox for every option", () => {
      renderWithIntl(<Harness section={authorSection} initialValue={[]} />);

      expect(screen.getAllByRole("checkbox")).toHaveLength(3);
      expect(screen.getByText(t("libraryWorkspace.authors"))).toBeVisible();
      expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    });

    it("should check the options included in the current value", () => {
      renderWithIntl(
        <Harness section={authorSection} initialValue={["Octavia E. Butler"]} />,
      );

      expect(
        screen.getByRole("checkbox", { name: /Octavia E. Butler/ }),
      ).toBeChecked();
      expect(
        screen.getByRole("checkbox", { name: /Ursula K. Le Guin/ }),
      ).not.toBeChecked();
    });

    it("should treat a single string value as one selected option", () => {
      renderWithIntl(
        <Harness section={authorSection} initialValue="Ursula K. Le Guin" />,
      );

      expect(
        screen.getByRole("checkbox", { name: /Ursula K. Le Guin/ }),
      ).toBeChecked();
    });

    it("should show option counts in the checkbox labels", () => {
      renderWithIntl(<Harness section={authorSection} initialValue={[]} />);

      expect(
        screen.getByRole("checkbox", { name: /^Ursula K. Le Guin\s*2$/ }),
      ).toBeInTheDocument();
    });

    it("should add and remove values when options are toggled", async () => {
      const user = userEvent.setup();
      renderWithIntl(<Harness section={authorSection} initialValue={[]} />);

      const leGuin = screen.getByRole("checkbox", { name: /Ursula K. Le Guin/ });
      const butler = screen.getByRole("checkbox", { name: /Octavia E. Butler/ });

      await user.click(leGuin);
      await user.click(butler);

      expect(leGuin).toBeChecked();
      expect(butler).toBeChecked();
      expect(
        screen.getByRole("status", { name: "current value" }),
      ).toHaveTextContent("Ursula K. Le Guin|Octavia E. Butler");

      await user.click(leGuin);

      expect(leGuin).not.toBeChecked();
      expect(butler).toBeChecked();
      expect(
        screen.getByRole("status", { name: "current value" }),
      ).toHaveTextContent(/^Octavia E. Butler$/);
    });

    it("should disable options marked as disabled", () => {
      renderWithIntl(<Harness section={authorSection} initialValue={[]} />);

      expect(
        screen.getByRole("checkbox", { name: /N. K. Jemisin/ }),
      ).toBeDisabled();
    });
  });
});
