import { render, screen } from "@testing-library/react";
import { BookOpen } from "lucide-react";
import { describe, expect, it } from "vitest";
import { t } from "@/test/utils";
import EmptyState from "./empty-state";

describe("EmptyState", () => {
  it("should render the message", () => {
    render(
      <EmptyState icon={<BookOpen aria-hidden="true" />}>
        {t("libraryWorkspace.noBooksMatch")}
      </EmptyState>,
    );

    expect(screen.getByText(t("libraryWorkspace.noBooksMatch"))).toBeInTheDocument();
  });

  it("should render the icon alongside the message", () => {
    render(
      <EmptyState icon={<span role="img" aria-label="Empty shelf" />}>
        {t("libraryWorkspace.noBooksMatch")}
      </EmptyState>,
    );

    const icon = screen.getByRole("img", { name: "Empty shelf" });
    const paragraph = icon.parentElement!;
    expect(paragraph).toHaveClass("empty");
    expect(paragraph).toHaveTextContent(t("libraryWorkspace.noBooksMatch"));
  });

  it("should render rich children content", () => {
    render(
      <EmptyState icon={<BookOpen aria-hidden="true" />}>
        <strong>{t("libraryWorkspace.noBooksMatch")}</strong>
      </EmptyState>,
    );

    expect(screen.getByText(t("libraryWorkspace.noBooksMatch")).tagName).toBe("STRONG");
  });
});
