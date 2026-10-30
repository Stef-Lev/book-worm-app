import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { renderWithIntl, t } from "@/test/utils";
import LoginPage from "./login-page";

// Server actions depend on next-auth + MongoDB, which can't run in jsdom.
vi.mock("@/actions/auth", () => ({
  loginAction: async (_previous: unknown, formData: FormData) =>
    formData.get("password") === "correct-horse"
      ? {}
      : { error: "invalidCredentials" },
}));

async function renderPage() {
  return renderWithIntl(<ToastProvider>{await LoginPage()}</ToastProvider>);
}

describe("LoginPage", () => {
  it("should render the login title and description", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      t("pages.login.title"),
    );
    expect(screen.getByRole("main")).toHaveTextContent(
      t("pages.login.description"),
    );
  });

  it("should render the email and password fields", async () => {
    await renderPage();

    expect(screen.getByRole("textbox", { name: t("auth.email") })).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.getByLabelText(t("auth.password"))).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });

  it("should link to the register and forgot password pages", async () => {
    await renderPage();

    expect(screen.getByRole("main")).toHaveTextContent(t("auth.noAccount"));
    expect(
      screen.getByRole("link", { name: t("auth.registerTitle") }),
    ).toHaveAttribute("href", "/register");
    expect(
      screen.getByRole("link", { name: t("pages.login.forgotPassword") }),
    ).toHaveAttribute("href", "/forgot-password");
  });

  it("should show an error when the credentials are invalid", async () => {
    const user = userEvent.setup();
    await renderPage();

    await user.type(
      screen.getByRole("textbox", { name: t("auth.email") }),
      "reader@example.com",
    );
    await user.type(screen.getByLabelText(t("auth.password")), "wrong");
    await user.click(
      screen.getByRole("button", { name: t("auth.loginSubmit") }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("auth.errors.invalidCredentials"),
    );
  });
});
