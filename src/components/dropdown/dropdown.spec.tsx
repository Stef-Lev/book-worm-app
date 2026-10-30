import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Dropdown from "./dropdown";
import type { DropdownOption, DropdownProps } from "./dropdown.types";

const options: DropdownOption[] = [
  { value: "title", label: "Title" },
  { value: "author", label: "Author" },
  { value: "rating", label: "Rating", disabled: true },
  { value: 2024, label: "Year 2024" },
];

type HarnessProps = Partial<Omit<DropdownProps, "value" | "onValueChange">> & {
  initialValue?: string | number;
};

function Harness({ initialValue = "title", ...props }: HarnessProps) {
  const [value, setValue] = useState<string | number>(initialValue);
  return (
    <form aria-label="Sort form">
      <Dropdown label="Sort by" options={options} value={value} onValueChange={setValue} {...props} />
      <output aria-label="Selected value">{value}</output>
    </form>
  );
}

describe("Dropdown", () => {
  it("should render a labelled combobox showing the selected option", () => {
    render(<Harness />);

    const trigger = screen.getByRole("combobox", { name: "Sort by" });
    expect(trigger).toHaveTextContent("Title");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveClass("trigger");
    expect(trigger).not.toHaveClass("compact");
  });

  it("should match numeric values to their option", () => {
    render(<Harness initialValue={2024} />);

    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveTextContent("Year 2024");
  });

  it("should list the options when opened", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole("combobox", { name: "Sort by" });
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(4);
    ["Title", "Author", "Rating", "Year 2024"].forEach((label, index) =>
      expect(options[index]).toHaveTextContent(label),
    );
    expect(screen.getByRole("option", { name: "Title" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: "Rating" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("should select an option and close the list", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("combobox", { name: "Sort by" }));
    await user.click(screen.getByRole("option", { name: "Author" }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveTextContent("Author");
    expect(screen.getByRole("status", { name: "Selected value" })).toHaveTextContent("author");
  });

  it("should return numeric option values as strings", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("combobox", { name: "Sort by" }));
    await user.click(screen.getByRole("option", { name: "Year 2024" }));

    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveTextContent("Year 2024");
    expect(screen.getByRole("status", { name: "Selected value" })).toHaveTextContent("2024");
  });

  it("should not select a disabled option", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("combobox", { name: "Sort by" }));
    await user.click(screen.getByRole("option", { name: "Rating" }));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveTextContent("Title");
    expect(screen.getByRole("status", { name: "Selected value" })).toHaveTextContent("title");
  });

  it("should select an option with the keyboard", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    screen.getByRole("combobox", { name: "Sort by" }).focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}{Enter}");

    expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveTextContent("Author");
  });

  it("should not open when disabled", async () => {
    const user = userEvent.setup();
    render(<Harness disabled />);

    const trigger = screen.getByRole("combobox", { name: "Sort by" });
    expect(trigger).toBeDisabled();
    await user.click(trigger);

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("should describe the trigger with the hint", () => {
    render(<Harness hint="Applies to the whole library" />);

    const trigger = screen.getByRole("combobox", { name: "Sort by" });
    expect(trigger).toHaveAccessibleDescription("Applies to the whole library");
    expect(trigger).not.toHaveAttribute("aria-invalid");
  });

  it("should show the error and mark the trigger invalid", () => {
    render(<Harness hint="Applies to the whole library" error="Choose a sort order" />);

    const trigger = screen.getByRole("combobox", { name: "Sort by" });
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveClass("invalid");
    expect(trigger).toHaveAccessibleDescription("Choose a sort order");
    expect(screen.queryByText("Applies to the whole library")).not.toBeInTheDocument();
  });

  it("should apply the compact size and custom class names", () => {
    render(<Harness size="sm" className="toolbar" fieldClassName="inline" />);

    const trigger = screen.getByRole("combobox", { name: "Sort by" });
    expect(trigger).toHaveClass("trigger", "compact", "toolbar");
    expect(trigger.parentElement).toHaveClass("field", "inline");
  });

  it("should submit the current value through a hidden input when named", async () => {
    const user = userEvent.setup();
    render(<Harness name="sort" />);

    const form = screen.getByRole("form", { name: "Sort form" }) as HTMLFormElement;
    expect(new FormData(form).get("sort")).toBe("title");

    await user.click(screen.getByRole("combobox", { name: "Sort by" }));
    await user.click(screen.getByRole("option", { name: "Author" }));

    expect(new FormData(form).get("sort")).toBe("author");
  });

  it("should not submit a value without a name", () => {
    render(<Harness />);

    const form = screen.getByRole("form", { name: "Sort form" }) as HTMLFormElement;
    expect([...new FormData(form).keys()]).toEqual([]);
  });
});
