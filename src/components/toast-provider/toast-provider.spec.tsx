import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "react-toastify";
import { describe, expect, it } from "vitest";
import { renderWithIntl, t } from "@/test/utils";
import ToastProvider from "./toast-provider";

function NotifyButton() {
  return (
    <button type="button" onClick={() => toast.success("Book saved")}>
      Notify
    </button>
  );
}

describe("ToastProvider", () => {
  it("should render its children", () => {
    renderWithIntl(
      <ToastProvider>
        <h1>Page content</h1>
      </ToastProvider>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Page content",
    );
  });

  it("should show a notification when a toast is triggered", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <ToastProvider>
        <NotifyButton />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Notify" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Book saved");
  });

  it("should render a translated dismiss button on each notification", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <ToastProvider>
        <NotifyButton />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Notify" }));

    const dismiss = await screen.findByRole("button", {
      name: t("notifications.dismiss"),
    });
    expect(dismiss).toHaveAttribute("title", t("notifications.dismiss"));
  });

  it("should expose the notifications region with a translated label", () => {
    renderWithIntl(
      <ToastProvider>
        <p>content</p>
      </ToastProvider>,
    );

    expect(
      screen.getByRole("region", { name: new RegExp(t("notifications.label")) }),
    ).toBeInTheDocument();
  });
});
