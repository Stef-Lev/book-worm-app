import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { renderWithIntl, t } from "@/test/utils";
import MobileNavigation from "./mobile-navigation";

// jsdom does not implement matchMedia; fake a viewport that is (or isn't) desktop.
function stubViewport({ desktop }: { desktop: boolean }) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: desktop,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

const links = [
  { href: "/library", label: "Library link" },
  { href: "/search", label: "Search link" },
];

function renderNavigation() {
  // The drawer keeps the notification region (rendered by ToastProvider) interactive.
  return renderWithIntl(
    <ToastProvider>
      <MobileNavigation links={links}>
        <button type="button">Account action</button>
      </MobileNavigation>
    </ToastProvider>,
  );
}

async function openMenu() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: t("nav.menu") }));
  return user;
}

describe("MobileNavigation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should render only the menu trigger while closed", () => {
    stubViewport({ desktop: false });
    renderNavigation();

    expect(
      screen.getByRole("button", { name: t("nav.menu") }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Library link" }),
    ).not.toBeInTheDocument();
  });

  it("should open a drawer with the navigation links and children", async () => {
    stubViewport({ desktop: false });
    renderNavigation();

    await openMenu();

    const dialog = await screen.findByRole("dialog", { name: t("nav.menu") });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: t("nav.menu") }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Library link" })).toHaveAttribute(
      "href",
      "/library",
    );
    expect(screen.getByRole("link", { name: "Search link" })).toHaveAttribute(
      "href",
      "/search",
    );
    expect(
      screen.getByRole("button", { name: "Account action" }),
    ).toBeInTheDocument();
  });

  it("should close the drawer with the close button", async () => {
    stubViewport({ desktop: false });
    renderNavigation();
    const user = await openMenu();

    await user.click(
      await screen.findByRole("button", { name: t("nav.closeMenu") }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("should close the drawer when a link is clicked", async () => {
    stubViewport({ desktop: false });
    renderNavigation();
    const user = await openMenu();

    await user.click(await screen.findByRole("link", { name: "Library link" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("should close the drawer when an account action is clicked", async () => {
    stubViewport({ desktop: false });
    renderNavigation();
    const user = await openMenu();

    await user.click(
      await screen.findByRole("button", { name: "Account action" }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("should close the drawer when the viewport is desktop sized", async () => {
    stubViewport({ desktop: true });
    renderNavigation();

    await openMenu();

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
