import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import TextInput from "./text-input";

function Harness() {
  const [value, setValue] = useState("");
  return (
    <>
      <TextInput
        label="Title"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        error={value ? undefined : "Title is required"}
      />
      <output aria-label="Preview">{value}</output>
    </>
  );
}

describe("TextInput", () => {
  it("should render a labelled control with defaults", () => {
    render(<TextInput label="Title" />);

    const input = screen.getByRole("textbox", { name: "Title" });
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveClass("input");
    expect(input).not.toHaveClass("invalid");
    expect(input).toBeValid();
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("should forward native attributes and custom class names", () => {
    render(
      <TextInput
        label="Title"
        name="title"
        placeholder="Enter a title"
        required
        className="control"
        fieldClassName="field-extra"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Title" });
    expect(input).toHaveAttribute("name", "title");
    expect(input).toHaveAttribute("placeholder", "Enter a title");
    expect(input).toBeRequired();
    expect(input).toHaveClass("input", "control");
    expect(input.parentElement).toHaveClass("field", "field-extra");
  });

  it("should use the provided id", () => {
    render(<TextInput id="book-title" label="Title" />);

    expect(screen.getByRole("textbox", { name: "Title" })).toHaveAttribute("id", "book-title");
  });

  it("should describe the control with the hint", () => {
    render(<TextInput label="Title" hint="As printed on the cover" />);

    const input = screen.getByRole("textbox", { name: "Title" });
    expect(input).toHaveAccessibleDescription("As printed on the cover");
    expect(input).toBeValid();
  });

  it("should show the error and mark the control invalid", () => {
    render(<TextInput label="Title" hint="As printed on the cover" error="Title is required" />);

    const input = screen.getByRole("textbox", { name: "Title" });
    expect(input).toBeInvalid();
    expect(input).toHaveClass("invalid");
    expect(input).toHaveAccessibleDescription("Title is required");
    expect(screen.queryByText("As printed on the cover")).not.toBeInTheDocument();
  });

  it("should combine an existing description with the message", () => {
    render(
      <>
        <p id="extra">Optional field</p>
        <TextInput label="Title" aria-describedby="extra" hint="As printed on the cover" />
      </>,
    );

    expect(screen.getByRole("textbox", { name: "Title" })).toHaveAccessibleDescription(
      "Optional field As printed on the cover",
    );
  });

  it("should update the value and clear the error as the user types", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByRole("textbox", { name: "Title" });
    expect(input).toBeInvalid();

    await user.type(input, "Dune");

    expect(input).toHaveValue("Dune");
    expect(input).toBeValid();
    expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Preview" })).toHaveTextContent("Dune");
  });

  it("should not accept input when disabled", async () => {
    const user = userEvent.setup();
    render(<TextInput label="Title" disabled />);

    const input = screen.getByRole("textbox", { name: "Title" });
    expect(input).toBeDisabled();
    await user.type(input, "Dune");

    expect(input).toHaveValue("");
  });
});
