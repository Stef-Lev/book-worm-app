import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Container from "./container";

describe("Container", () => {
  it("should render its children", () => {
    render(
      <Container>
        <h2>Shelf</h2>
        <p>Content</p>
      </Container>,
    );

    expect(screen.getByRole("heading", { name: "Shelf" })).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("should wrap children in a container element with the base class", () => {
    render(
      <Container>
        <h2>Shelf</h2>
      </Container>,
    );

    expect(screen.getByRole("heading", { name: "Shelf" }).parentElement).toHaveClass(
      "container",
    );
  });

  it("should merge a custom class name", () => {
    render(
      <Container className="wide">
        <h2>Shelf</h2>
      </Container>,
    );

    expect(screen.getByRole("heading", { name: "Shelf" }).parentElement).toHaveClass(
      "container",
      "wide",
    );
  });
});
