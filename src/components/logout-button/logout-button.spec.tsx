import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { logoutAction } from "@/actions/auth";
import { renderWithIntl, t } from "@/test/utils";
import LogoutButton from "./logout-button";

// The real action signs out through next-auth, which can't run in jsdom.
vi.mock("@/actions/auth", () => ({ logoutAction: vi.fn(async () => {}) }));

describe("LogoutButton", () => {
  it("should render a labelled submit button", async () => {
    renderWithIntl(await LogoutButton());

    const button = screen.getByRole("button", { name: t("nav.logout") });
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("title", t("nav.logout"));
  });

  it("should sign out when clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(await LogoutButton());

    await user.click(screen.getByRole("button", { name: t("nav.logout") }));

    await waitFor(() => expect(logoutAction).toHaveBeenCalledTimes(1));
  });
});
