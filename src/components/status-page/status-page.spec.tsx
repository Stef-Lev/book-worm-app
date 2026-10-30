import { screen } from "@testing-library/react";
import { SearchX } from "lucide-react";
import { describe, expect, it } from "vitest";
import { renderWithIntl, t } from "@/test/utils";
import StatusPage from "./status-page";

function renderStatusPage() {
  return renderWithIntl(
    <StatusPage
      code={404}
      title={t("pages.notFound.title")}
      description={t("pages.notFound.description")}
      icon={SearchX}
      action={{ href: "/library", label: t("pages.notFound.backHome") }}
    />,
  );
}

describe("StatusPage", () => {
  it("should render a main landmark labelled by the title", () => {
    renderStatusPage();

    expect(screen.getByRole("main", { name: t("pages.notFound.title") })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      t("pages.notFound.title"),
    );
  });

  it("should show the status code and description", () => {
    renderStatusPage();

    const main = screen.getByRole("main");
    expect(main).toHaveTextContent("404");
    expect(main).toHaveTextContent(t("pages.notFound.description"));
  });

  it("should render the action as a button-styled link", () => {
    renderStatusPage();

    const link = screen.getByRole("link", { name: t("pages.notFound.backHome") });
    expect(link).toHaveAttribute("href", "/library");
    expect(link).toHaveClass("button", "primary");
  });

  it("should hide decorative icons from assistive technology", () => {
    renderStatusPage();

    const icons = screen.getByRole("main").querySelectorAll("svg");
    expect(icons).toHaveLength(2);
    icons.forEach((icon) => expect(icon).toHaveAttribute("aria-hidden", "true"));
  });
});
