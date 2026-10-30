import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Button from "./button";

function CounterHarness({ disabled, loading }: { disabled?: boolean; loading?: boolean }) {
  const [count, setCount] = useState(0);
  return (
    <>
      <Button disabled={disabled} loading={loading} onClick={() => setCount((c) => c + 1)}>
        Increment
      </Button>
      <output aria-label="Count">{count}</output>
    </>
  );
}

describe("Button", () => {
  it("should render its children as the accessible name", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveTextContent("Save");
  });

  it("should default to a non-submitting primary button", () => {
    render(<Button>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("button", "primary");
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy");
  });

  it.each(["secondary", "outline", "destructive"] as const)(
    "should apply the %s variant",
    (variant) => {
      render(<Button variant={variant}>Action</Button>);

      const button = screen.getByRole("button", { name: "Action" });
      expect(button).toHaveClass(variant);
      expect(button).not.toHaveClass("primary");
    },
  );

  it("should allow overriding the type and merging a custom class name", () => {
    render(
      <Button type="submit" className="custom">
        Submit
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Submit" });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveClass("button", "custom");
  });

  it("should forward extra attributes to the button element", () => {
    render(
      <Button aria-label="Close panel" title="Close">
        X
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Close panel" })).toHaveAttribute(
      "title",
      "Close",
    );
  });

  it("should run the click handler when clicked", async () => {
    const user = userEvent.setup();
    render(<CounterHarness />);

    await user.click(screen.getByRole("button", { name: "Increment" }));
    await user.click(screen.getByRole("button", { name: "Increment" }));

    expect(screen.getByRole("status", { name: "Count" })).toHaveTextContent("2");
  });

  it("should not react to clicks when disabled", async () => {
    const user = userEvent.setup();
    render(<CounterHarness disabled />);

    const button = screen.getByRole("button", { name: "Increment" });
    expect(button).toBeDisabled();
    await user.click(button);

    expect(screen.getByRole("status", { name: "Count" })).toHaveTextContent("0");
  });

  it("should be disabled and marked busy while loading", async () => {
    const user = userEvent.setup();
    render(<CounterHarness loading />);

    const button = screen.getByRole("button", { name: "Increment" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveClass("loading");
    await user.click(button);

    expect(screen.getByRole("status", { name: "Count" })).toHaveTextContent("0");
  });

  it("should keep a provided aria-busy value when not loading", () => {
    render(<Button aria-busy>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "aria-busy",
      "true",
    );
  });
});
