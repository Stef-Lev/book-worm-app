import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { setSearchParams, testRouter } from "@/test/navigation";
import { renderWithIntl, t } from "@/test/utils";
import ResetPasswordPage from "./reset-password-page";

const VALID_TOKEN = "valid-token";

// In-memory stand-in for POST /api/auth/reset-password.
function stubResetPasswordApi() {
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) !== "/api/auth/reset-password" || init?.method !== "POST")
      return new Response(null, { status: 404 });
    const { token } = JSON.parse(String(init.body)) as { token: string };
    return token === VALID_TOKEN
      ? Response.json({ ok: true })
      : Response.json({ error: "Reset token has expired" }, { status: 400 });
  });
}

function renderPage() {
  return renderWithIntl(
    <ToastProvider>
      <ResetPasswordPage />
    </ToastProvider>,
  );
}

async function submitPasswords(password: string, confirmation: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(t("auth.password")), password);
  await user.type(
    screen.getByLabelText(t("pages.resetPassword.confirmPassword")),
    confirmation,
  );
  await user.click(
    screen.getByRole("button", { name: t("pages.resetPassword.submit") }),
  );
}

describe("ResetPasswordPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should show an invalid link message when the token is missing", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      t("pages.resetPassword.title"),
    );
    expect(screen.getByRole("main")).toHaveTextContent(
      t("pages.resetPassword.invalidLink"),
    );
    expect(
      screen.queryByRole("button", { name: t("pages.resetPassword.submit") }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: t("auth.loginTitle") }),
    ).toHaveAttribute("href", "/login");
  });

  it("should render the password form when a token is present", () => {
    setSearchParams({ token: VALID_TOKEN });
    renderPage();

    expect(screen.getByRole("main")).toHaveTextContent(
      t("pages.resetPassword.description"),
    );
    expect(screen.getByLabelText(t("auth.password"))).toBeRequired();
    expect(
      screen.getByLabelText(t("pages.resetPassword.confirmPassword")),
    ).toBeRequired();
    expect(
      screen.getByRole("link", { name: t("auth.loginTitle") }),
    ).toHaveAttribute("href", "/login");
  });

  it("should show an error when the passwords do not match", async () => {
    setSearchParams({ token: VALID_TOKEN });
    stubResetPasswordApi();
    renderPage();

    await submitPasswords("new-password", "other-password");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("pages.resetPassword.passwordMismatch"),
    );
    expect(testRouter.push).not.toHaveBeenCalled();
  });

  it("should show an error when the password is too short", async () => {
    setSearchParams({ token: VALID_TOKEN });
    stubResetPasswordApi();
    renderPage();

    await submitPasswords("abc", "abc");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("pages.resetPassword.passwordTooShort"),
    );
  });

  it("should confirm the reset and go to the login page", async () => {
    setSearchParams({ token: VALID_TOKEN });
    stubResetPasswordApi();
    renderPage();

    await submitPasswords("new-password", "new-password");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("pages.resetPassword.success"),
    );
    expect(testRouter.push).toHaveBeenCalledWith("/login");
  });

  it("should show the server error when the reset is rejected", async () => {
    setSearchParams({ token: "expired-token" });
    stubResetPasswordApi();
    renderPage();

    await submitPasswords("new-password", "new-password");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Reset token has expired",
    );
    expect(testRouter.push).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: t("pages.resetPassword.submit") }),
    ).toBeEnabled();
  });

  it("should show a generic error when the request fails", async () => {
    setSearchParams({ token: VALID_TOKEN });
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("Failed to fetch");
    });
    renderPage();

    await submitPasswords("new-password", "new-password");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("pages.resetPassword.error"),
    );
  });
});
