import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl, t } from "@/test/utils";
import NotFoundPage from "./not-found-page";

describe("NotFoundPage", () => {
  it("should render the not found title and description", async () => {
    renderWithIntl(await NotFoundPage());

    expect(screen.getByRole("main")).toHaveTextContent("404");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      t("pages.notFound.title"),
    );
    expect(screen.getByRole("main")).toHaveTextContent(
      t("pages.notFound.description"),
    );
  });

  it("should link back to the home page", async () => {
    renderWithIntl(await NotFoundPage());

    expect(
      screen.getByRole("link", { name: t("pages.notFound.backHome") }),
    ).toHaveAttribute("href", "/");
  });
});
