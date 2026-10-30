import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FormField from "./form-field";
import { useFormField } from "./use-form-field";

type ControlProps = {
  label: string;
  id?: string;
  hint?: string;
  error?: string;
  describedBy?: string;
  invalid?: boolean;
};

function Control({ label, id, hint, error, describedBy, invalid }: ControlProps) {
  const field = useFormField({
    id,
    hint,
    error,
    "aria-describedby": describedBy,
    "aria-invalid": invalid,
  });
  return (
    <FormField id={field.id} label={label} hint={hint} error={error}>
      <input {...field} />
    </FormField>
  );
}

describe("FormField", () => {
  it("should associate the label with the control", () => {
    render(
      <FormField id="title" label="Title">
        <input id="title" />
      </FormField>,
    );

    expect(screen.getByRole("textbox", { name: "Title" })).toHaveAttribute("id", "title");
  });

  it("should not render a message without a hint or error", () => {
    const { container } = render(
      <FormField id="title" label="Title">
        <input id="title" />
      </FormField>,
    );

    expect(container.querySelector("p")).not.toBeInTheDocument();
  });

  it("should render the hint as a neutral message", () => {
    render(
      <FormField id="title" label="Title" hint="As printed on the cover">
        <input id="title" />
      </FormField>,
    );

    const hint = screen.getByText("As printed on the cover");
    expect(hint).toHaveAttribute("id", "title-message");
    expect(hint).not.toHaveClass("error");
  });

  it("should show the error instead of the hint", () => {
    render(
      <FormField id="title" label="Title" hint="As printed on the cover" error="Title is required">
        <input id="title" />
      </FormField>,
    );

    expect(screen.getByText("Title is required")).toHaveClass("message", "error");
    expect(screen.queryByText("As printed on the cover")).not.toBeInTheDocument();
  });

  it("should merge a custom class name on the wrapper", () => {
    render(
      <FormField id="title" label="Title" className="wide">
        <input id="title" />
      </FormField>,
    );

    expect(screen.getByRole("textbox", { name: "Title" }).parentElement).toHaveClass(
      "field",
      "wide",
    );
  });

  describe("with useFormField", () => {
    it("should generate an id that links the label to the control", () => {
      render(
        <>
          <Control label="Title" />
          <Control label="Author" />
        </>,
      );

      const title = screen.getByRole("textbox", { name: "Title" });
      const author = screen.getByRole("textbox", { name: "Author" });
      expect(title.id).not.toBe("");
      expect(title.id).not.toBe(author.id);
    });

    it("should use the provided id", () => {
      render(<Control id="book-title" label="Title" />);

      expect(screen.getByRole("textbox", { name: "Title" })).toHaveAttribute("id", "book-title");
    });

    it("should leave the control valid and undescribed by default", () => {
      render(<Control label="Title" />);

      const input = screen.getByRole("textbox", { name: "Title" });
      expect(input).not.toHaveAttribute("aria-describedby");
      expect(input).toBeValid();
    });

    it("should describe the control with the hint", () => {
      render(<Control label="Title" hint="As printed on the cover" />);

      const input = screen.getByRole("textbox", { name: "Title" });
      expect(input).toHaveAccessibleDescription("As printed on the cover");
      expect(input).toBeValid();
    });

    it("should mark the control invalid and describe it with the error", () => {
      render(<Control label="Title" hint="As printed on the cover" error="Title is required" />);

      const input = screen.getByRole("textbox", { name: "Title" });
      expect(input).toBeInvalid();
      expect(input).toHaveAccessibleDescription("Title is required");
    });

    it("should combine an existing description with the message", () => {
      render(
        <>
          <p id="extra">Optional field</p>
          <Control label="Title" describedBy="extra" hint="As printed on the cover" />
        </>,
      );

      expect(screen.getByRole("textbox", { name: "Title" })).toHaveAccessibleDescription(
        "Optional field As printed on the cover",
      );
    });

    it("should keep an explicit invalid state without an error", () => {
      render(<Control label="Title" invalid />);

      expect(screen.getByRole("textbox", { name: "Title" })).toBeInvalid();
    });
  });
});
