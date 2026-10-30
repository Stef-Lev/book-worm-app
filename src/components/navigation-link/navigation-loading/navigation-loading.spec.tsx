import { render, screen } from "@testing-library/react";
import Link from "next/link";
import { describe, expect, it } from "vitest";
import NavigationLoading from "./navigation-loading";

describe("NavigationLoading", () => {
  it("should render nothing while the link is not pending", () => {
    render(
      <Link href="/library">
        Library
        <NavigationLoading />
      </Link>,
    );

    expect(screen.getByRole("link", { name: "Library" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should render nothing outside of a link", () => {
    const { container } = render(<NavigationLoading />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
