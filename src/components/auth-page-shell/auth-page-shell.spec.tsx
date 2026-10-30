import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/test/utils";
import AuthPageShell from "./auth-page-shell";

function renderShell() {
  return renderWithIntl(
    <AuthPageShell
      title="Welcome"
      description="Sign in to continue"
      footer={<a href="/help">Need help?</a>}
    >
      <button type="button">Continue</button>
    </AuthPageShell>,
  );
}

describe("AuthPageShell", () => {
  it("should render the title as the page heading", () => {
    renderShell();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Welcome",
    );
  });

  it("should render the description inside the main landmark", () => {
    renderShell();

    expect(screen.getByRole("main")).toHaveTextContent("Sign in to continue");
  });

  it("should render the children and the footer", () => {
    renderShell();

    expect(
      screen.getByRole("button", { name: "Continue" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Need help?" })).toHaveAttribute(
      "href",
      "/help",
    );
  });

  it("should link the brand back to the home page", () => {
    renderShell();

    expect(screen.getByRole("link", { name: "PaperSmell" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
