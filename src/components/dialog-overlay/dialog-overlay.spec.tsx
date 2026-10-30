import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "@ark-ui/react/dialog";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/utils";
import DialogOverlay from "./dialog-overlay";
import type { DialogOverlayProps } from "./dialog-overlay.types";

function TestDialog({ placement }: Pick<DialogOverlayProps, "placement">) {
  return (
    <Dialog.Root>
      <Dialog.Trigger>Open filters</Dialog.Trigger>
      <DialogOverlay placement={placement}>
        <Dialog.Content>
          <Dialog.Title>Filters</Dialog.Title>
          <Dialog.CloseTrigger>Done</Dialog.CloseTrigger>
        </Dialog.Content>
      </DialogOverlay>
    </Dialog.Root>
  );
}

describe("DialogOverlay", () => {
  it("should not show the dialog until it is opened", () => {
    renderWithIntl(<TestDialog />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should show the dialog content centred by default", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TestDialog />);

    await user.click(screen.getByRole("button", { name: "Open filters" }));

    const dialog = screen.getByRole("dialog", { name: "Filters" });
    expect(dialog.parentElement).toHaveClass("center");
  });

  it("should render the dialog as a bottom sheet", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TestDialog placement="bottom" />);

    await user.click(screen.getByRole("button", { name: "Open filters" }));

    const dialog = screen.getByRole("dialog", { name: "Filters" });
    expect(dialog.parentElement).toHaveClass("bottom");
    expect(dialog.parentElement).not.toHaveClass("center");
  });

  it("should portal the overlay to the document body with a backdrop", async () => {
    const user = userEvent.setup();
    const { container } = renderWithIntl(<TestDialog />);

    await user.click(screen.getByRole("button", { name: "Open filters" }));

    expect(container).not.toContainElement(screen.getByRole("dialog", { name: "Filters" }));
    expect(document.body.querySelector(".backdrop")).toBeInTheDocument();
  });

  it("should close the dialog from inside the content", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TestDialog />);

    await user.click(screen.getByRole("button", { name: "Open filters" }));
    await user.click(screen.getByRole("button", { name: "Done" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("should close the dialog with the escape key", async () => {
    const user = userEvent.setup();
    renderWithIntl(<TestDialog />);

    await user.click(screen.getByRole("button", { name: "Open filters" }));
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
