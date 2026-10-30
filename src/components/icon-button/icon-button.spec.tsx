import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { X } from "lucide-react";
import { describe, expect, it } from "vitest";
import IconButton from "./icon-button";

function ToggleHarness({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <>
      {open && <p>Panel content</p>}
      <IconButton label="Close panel" disabled={disabled} onClick={() => setOpen(false)}>
        <X aria-hidden="true" />
      </IconButton>
    </>
  );
}

describe("IconButton", () => {
  it("should use the label as the accessible name and default title", () => {
    render(
      <IconButton label="Close">
        <X aria-hidden="true" />
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toHaveAttribute("title", "Close");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("button");
  });

  it("should allow a custom title, type and class name", () => {
    render(
      <IconButton label="Send" title="Send message" type="submit" className="extra">
        <X aria-hidden="true" />
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Send" });
    expect(button).toHaveAttribute("title", "Send message");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveClass("button", "extra");
  });

  it("should run the click handler when clicked", async () => {
    const user = userEvent.setup();
    render(<ToggleHarness />);

    await user.click(screen.getByRole("button", { name: "Close panel" }));

    expect(screen.queryByText("Panel content")).not.toBeInTheDocument();
  });

  it("should not react to clicks when disabled", async () => {
    const user = userEvent.setup();
    render(<ToggleHarness disabled />);

    const button = screen.getByRole("button", { name: "Close panel" });
    expect(button).toBeDisabled();
    await user.click(button);

    expect(screen.getByText("Panel content")).toBeInTheDocument();
  });
});
