import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCALE_LABELS, Locale } from "@/i18n/config";
import { Theme } from "@/lib/preferences";
import { testRouter } from "@/test/navigation";
import { renderWithIntl, t } from "@/test/utils";
import PreferencesSwitcher from "./preferences-switcher";

// jsdom does not implement matchMedia; fake the OS colour-scheme preference.
function stubSystemTheme({ dark }: { dark: boolean }) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: dark,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }));
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0`;
}

const languageLabel = t("preferences.switchLanguage", {
  language: LOCALE_LABELS[Locale.El],
});

describe("PreferencesSwitcher", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearCookie("locale");
    clearCookie("theme");
    document.documentElement.lang = "";
    delete document.documentElement.dataset.theme;
  });

  it("should offer switching to the other language", () => {
    stubSystemTheme({ dark: false });
    renderWithIntl(<PreferencesSwitcher theme={Theme.Light} />);

    expect(
      screen.getByRole("button", { name: languageLabel }),
    ).toBeEnabled();
  });

  it("should store the next locale and refresh when switching language", async () => {
    const user = userEvent.setup();
    stubSystemTheme({ dark: false });
    renderWithIntl(<PreferencesSwitcher theme={Theme.Light} />);

    await user.click(screen.getByRole("button", { name: languageLabel }));

    expect(document.cookie).toContain(`locale=${Locale.El}`);
    expect(document.documentElement).toHaveAttribute("lang", Locale.El);
    expect(testRouter.refresh).toHaveBeenCalled();
  });

  it("should show dark mode as off for the light theme", () => {
    stubSystemTheme({ dark: true });
    renderWithIntl(<PreferencesSwitcher theme={Theme.Light} />);

    const toggle = screen.getByRole("button", {
      name: t("preferences.darkMode"),
    });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveAttribute(
      "title",
      t("preferences.switchTheme", { theme: t("preferences.dark") }),
    );
  });

  it("should show dark mode as on for the dark theme", () => {
    stubSystemTheme({ dark: false });
    renderWithIntl(<PreferencesSwitcher theme={Theme.Dark} />);

    const toggle = screen.getByRole("button", {
      name: t("preferences.darkMode"),
    });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveAttribute(
      "title",
      t("preferences.switchTheme", { theme: t("preferences.light") }),
    );
  });

  it("should follow the system preference for the system theme", () => {
    stubSystemTheme({ dark: true });
    renderWithIntl(<PreferencesSwitcher theme={Theme.System} />);

    expect(
      screen.getByRole("button", { name: t("preferences.darkMode") }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("should toggle to the dark theme and persist it", async () => {
    const user = userEvent.setup();
    stubSystemTheme({ dark: false });
    renderWithIntl(<PreferencesSwitcher theme={Theme.Light} />);
    const toggle = screen.getByRole("button", {
      name: t("preferences.darkMode"),
    });

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveAttribute("data-theme", Theme.Dark);
    expect(document.cookie).toContain(`theme=${Theme.Dark}`);
  });

  it("should toggle back to the light theme", async () => {
    const user = userEvent.setup();
    stubSystemTheme({ dark: false });
    renderWithIntl(<PreferencesSwitcher theme={Theme.Dark} />);
    const toggle = screen.getByRole("button", {
      name: t("preferences.darkMode"),
    });

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement).toHaveAttribute("data-theme", Theme.Light);
    expect(document.cookie).toContain(`theme=${Theme.Light}`);
  });
});
