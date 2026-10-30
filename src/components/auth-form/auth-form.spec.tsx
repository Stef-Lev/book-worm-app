import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { AuthFormState } from "@/actions/auth";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { renderWithIntl, t } from "@/test/utils";
import AuthForm from "./auth-form";
import type { AuthFormField } from "./auth-form.types";

const fields: AuthFormField[] = [
  { label: t("auth.email"), type: "email", name: "email" },
  {
    label: t("auth.password"),
    hint: t("auth.passwordHint"),
    type: "password",
    name: "password",
  },
];

const VALID_EMAIL = "reader@example.com";
const VALID_PASSWORD = "correct-horse";

// In-memory stand-in for a credentials server action.
async function fakeLogin(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const ok =
    formData.get("email") === VALID_EMAIL &&
    formData.get("password") === VALID_PASSWORD;
  return ok ? {} : { error: "invalidCredentials" };
}

function renderForm(
  action: (
    previous: AuthFormState,
    formData: FormData,
  ) => Promise<AuthFormState> = fakeLogin,
) {
  return renderWithIntl(
    <ToastProvider>
      <AuthForm
        action={action}
        fields={fields}
        submitLabel={t("auth.loginSubmit")}
      />
    </ToastProvider>,
  );
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(t("auth.email")), email);
  await user.type(screen.getByLabelText(t("auth.password")), password);
  await user.click(screen.getByRole("button", { name: t("auth.loginSubmit") }));
}

describe("AuthForm", () => {
  it("should render a required input for each field", () => {
    renderForm();

    expect(screen.getByRole("textbox", { name: t("auth.email") })).toBeRequired();
    expect(screen.getByLabelText(t("auth.password"))).toBeRequired();
    expect(screen.getByLabelText(t("auth.password"))).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("should render field hints", () => {
    renderForm();

    expect(screen.getByText(t("auth.passwordHint"))).toBeInTheDocument();
  });

  it("should render the submit button with the given label", () => {
    renderForm();

    expect(
      screen.getByRole("button", { name: t("auth.loginSubmit") }),
    ).toHaveAttribute("type", "submit");
  });

  it("should show the translated error when the action fails", async () => {
    renderForm();

    await fillAndSubmit(VALID_EMAIL, "wrong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("auth.errors.invalidCredentials"),
    );
  });

  it("should not show an error when the action succeeds", async () => {
    renderForm();

    await fillAndSubmit(VALID_EMAIL, VALID_PASSWORD);

    expect(
      await screen.findByRole("button", { name: t("auth.loginSubmit") }),
    ).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should mark the submit button as busy while the action is pending", async () => {
    let resolve: (state: AuthFormState) => void = () => {};
    renderForm(
      () =>
        new Promise<AuthFormState>((done) => {
          resolve = done;
        }),
    );

    await fillAndSubmit(VALID_EMAIL, VALID_PASSWORD);

    const submit = screen.getByRole("button", { name: t("auth.loginSubmit") });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("aria-busy", "true");

    resolve({ error: "generic" });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      t("auth.errors.generic"),
    );
    expect(submit).toBeEnabled();
  });
});
