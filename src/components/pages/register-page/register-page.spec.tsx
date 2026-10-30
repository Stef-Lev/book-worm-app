import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { renderWithIntl, t } from "@/test/utils";
import RegisterPage from "./register-page";

const TAKEN_EMAIL = "taken@example.com";

// Server actions depend on next-auth + MongoDB, which can't run in jsdom.
vi.mock("@/actions/auth", () => ({
  registerAction: async (_previous: unknown, formData: FormData) =>
    formData.get("email") === TAKEN_EMAIL ? { error: "emailTaken" } : {},
}));

async function renderPage() {
  return renderWithIntl(<ToastProvider>{await RegisterPage()}</ToastProvider>);
}

describe("RegisterPage", () => {
  it("should render the register title and description", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      t("pages.register.title"),
    );
    expect(screen.getByRole("main")).toHaveTextContent(
      t("pages.register.description"),
    );
  });

  it("should render name, email and password fields", async () => {
    await renderPage();

    expect(
      screen.getByRole("textbox", { name: t("auth.name") }),
    ).toHaveAttribute("autocomplete", "name");
    expect(
      screen.getByRole("textbox", { name: t("auth.email") }),
    ).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(t("auth.password"))).toHaveAttribute(
      "minlength",
      "8",
    );
    expect(screen.getByText(t("auth.passwordHint"))).toBeInTheDocument();
  });

  it("should link to the login page", async () => {
    await renderPage();

    expect(screen.getByRole("main")).toHaveTextContent(t("auth.haveAccount"));
    expect(
      screen.getByRole("link", { name: t("auth.loginTitle") }),
    ).toHaveAttribute("href", "/login");
  });

  it("should show an error when the email is already registered", async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.type(screen.getByRole("textbox", { name: t("auth.name") }), "Jo");
    await user.type(
      screen.getByRole("textbox", { name: t("auth.email") }),
      TAKEN_EMAIL,
    );
    await user.type(screen.getByLabelText(t("auth.password")), "long-password");
    await user.click(
      screen.getByRole("button", { name: t("auth.registerSubmit") }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("auth.errors.emailTaken"),
    );
  });
});
