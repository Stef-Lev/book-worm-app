import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl, t } from "@/test/utils";
import HomePage from "./home-page";

describe("HomePage", () => {
  it("should render the hero title and description", async () => {
    renderWithIntl(await HomePage());

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      t("pages.home.title"),
    );
    expect(screen.getByRole("main")).toHaveTextContent(
      t("pages.home.description"),
    );
  });

  it("should link to the library", async () => {
    renderWithIntl(await HomePage());

    expect(
      screen.getByRole("link", { name: t("nav.library") }),
    ).toHaveAttribute("href", "/library");
  });

  it("should link to the book search", async () => {
    renderWithIntl(await HomePage());

    expect(
      screen.getByRole("link", { name: t("nav.searchLabel") }),
    ).toHaveAttribute("href", "/search");
  });
});
