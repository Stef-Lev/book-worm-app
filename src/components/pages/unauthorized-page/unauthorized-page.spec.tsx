import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl, t } from "@/test/utils";
import UnauthorizedPage from "./unauthorized-page";

describe("UnauthorizedPage", () => {
  it("should render the 401 code, title and description", async () => {
    renderWithIntl(await UnauthorizedPage());

    expect(screen.getByRole("main")).toHaveTextContent("401");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      t("pages.unauthorized.title"),
    );
    expect(screen.getByRole("main")).toHaveTextContent(
      t("pages.unauthorized.description"),
    );
  });

  it("should label the main landmark with the title", async () => {
    renderWithIntl(await UnauthorizedPage());

    expect(
      screen.getByRole("main", { name: t("pages.unauthorized.title") }),
    ).toBeInTheDocument();
  });

  it("should link to the login page", async () => {
    renderWithIntl(await UnauthorizedPage());

    expect(
      screen.getByRole("link", { name: t("pages.unauthorized.login") }),
    ).toHaveAttribute("href", "/login");
  });
});
