import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { renderWithIntl, t } from "@/test/utils";
import ForgotPasswordPage from "./forgot-password-page";

const KNOWN_EMAIL = "reader@example.com";

// In-memory stand-in for POST /api/auth/forgot-password.
function stubForgotPasswordApi(
  respond: (email: string) => Response | Promise<Response>,
) {
  vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
    if (String(input) !== "/api/auth/forgot-password" || init?.method !== "POST")
      return new Response(null, { status: 404 });
    const { email } = JSON.parse(String(init.body)) as { email: string };
    return respond(email);
  });
}

function renderPage() {
  return renderWithIntl(
    <ToastProvider>
      <ForgotPasswordPage />
    </ToastProvider>,
  );
}

async function submitEmail(email: string) {
  const user = userEvent.setup();
  await user.type(screen.getByRole("textbox", { name: t("auth.email") }), email);
  await user.click(
    screen.getByRole("button", { name: t("pages.forgotPassword.submit") }),
  );
}

describe("ForgotPasswordPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should render the title, description and email form", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      t("pages.forgotPassword.title"),
    );
    expect(screen.getByRole("main")).toHaveTextContent(
      t("pages.forgotPassword.description"),
    );
    expect(
      screen.getByRole("textbox", { name: t("auth.email") }),
    ).toBeRequired();
  });

  it("should link back to the login page", () => {
    renderPage();

    expect(screen.getByRole("main")).toHaveTextContent(t("auth.haveAccount"));
    expect(
      screen.getByRole("link", { name: t("auth.loginTitle") }),
    ).toHaveAttribute("href", "/login");
  });

  it("should show a confirmation once the reset link is sent", async () => {
    stubForgotPasswordApi((email) =>
      Response.json({ ok: email === KNOWN_EMAIL }, { status: 200 }),
    );
    renderPage();

    await submitEmail(KNOWN_EMAIL);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("pages.forgotPassword.emailSent"),
    );
    expect(screen.getByRole("main")).toHaveTextContent(
      t("pages.forgotPassword.checkEmail"),
    );
    expect(
      screen.queryByRole("textbox", { name: t("auth.email") }),
    ).not.toBeInTheDocument();
  });

  it("should show an error and keep the form when the request fails", async () => {
    stubForgotPasswordApi(() =>
      Response.json({ error: "Server error" }, { status: 500 }),
    );
    renderPage();

    await submitEmail(KNOWN_EMAIL);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("pages.forgotPassword.error"),
    );
    expect(
      screen.getByRole("textbox", { name: t("auth.email") }),
    ).toHaveValue(KNOWN_EMAIL);
    expect(
      screen.getByRole("button", { name: t("pages.forgotPassword.submit") }),
    ).toBeEnabled();
  });

  it("should show an error when the network is unavailable", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("Failed to fetch");
    });
    renderPage();

    await submitEmail(KNOWN_EMAIL);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("pages.forgotPassword.error"),
    );
  });

  it("should mark the submit button as busy while sending", async () => {
    let respond: (response: Response) => void = () => {};
    stubForgotPasswordApi(
      () =>
        new Promise<Response>((resolve) => {
          respond = resolve;
        }),
    );
    renderPage();

    await submitEmail(KNOWN_EMAIL);

    const submit = screen.getByRole("button", {
      name: t("pages.forgotPassword.submit"),
    });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("aria-busy", "true");

    respond(Response.json({ ok: true }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("pages.forgotPassword.emailSent"),
    );
  });
});
