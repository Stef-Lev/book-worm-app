import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NavigationLink from "./navigation-link";

describe("NavigationLink", () => {
  it("should render a link with its children and href", () => {
    render(<NavigationLink href="/library">Library</NavigationLink>);

    expect(screen.getByRole("link", { name: "Library" })).toHaveAttribute("href", "/library");
  });

  it("should build the href from a url object", () => {
    render(
      <NavigationLink href={{ pathname: "/library", query: { shelf: "read" } }}>
        Read books
      </NavigationLink>,
    );

    expect(screen.getByRole("link", { name: "Read books" })).toHaveAttribute(
      "href",
      "/library?shelf=read",
    );
  });

  it("should forward link attributes", () => {
    render(
      <NavigationLink href="/profile" className="nav" aria-current="page">
        Profile
      </NavigationLink>,
    );

    const link = screen.getByRole("link", { name: "Profile" });
    expect(link).toHaveClass("nav");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("should not show the loading indicator while idle", () => {
    render(<NavigationLink href="/library">Library</NavigationLink>);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
