import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BookCover from "./book-cover";

const COVER_URL = "https://covers.example.com/dune.jpg";

describe("BookCover", () => {
  it("should render the cover image with its alt text", () => {
    render(<BookCover src={COVER_URL} alt="Dune cover" />);

    const image = screen.getByRole("img", { name: "Dune cover" });
    expect(image).toHaveAttribute("src", COVER_URL);
    expect(image).toHaveAttribute("loading", "lazy");
    expect(image).toHaveClass("image");
  });

  it("should treat the image as decorative without alt text", () => {
    render(<BookCover src={COVER_URL} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("presentation")).toHaveAttribute("src", COVER_URL);
  });

  it("should show a labelled placeholder when there is no source", () => {
    render(<BookCover alt="Dune cover" />);

    const placeholder = screen.getByRole("img", { name: "Dune cover" });
    expect(placeholder).toHaveClass("placeholder");
    expect(placeholder).not.toHaveAttribute("src");
  });

  it("should hide the placeholder from assistive technology without alt text", () => {
    render(<BookCover />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  });

  it("should fall back to the placeholder when the image fails to load", () => {
    render(<BookCover src={COVER_URL} alt="Dune cover" />);

    fireEvent.error(screen.getByRole("img", { name: "Dune cover" }));

    const placeholder = screen.getByRole("img", { name: "Dune cover" });
    expect(placeholder).toHaveClass("placeholder");
    expect(placeholder).not.toHaveAttribute("src");
  });

  it("should try a new source after a previous one failed", () => {
    const { rerender } = render(<BookCover src={COVER_URL} alt="Dune cover" />);
    fireEvent.error(screen.getByRole("img", { name: "Dune cover" }));

    const nextUrl = "https://covers.example.com/dune-2.jpg";
    rerender(<BookCover src={nextUrl} alt="Dune cover" />);

    expect(screen.getByRole("img", { name: "Dune cover" })).toHaveAttribute("src", nextUrl);
  });

  it("should merge a custom class name on the wrapper", () => {
    render(<BookCover src={COVER_URL} alt="Dune cover" className="large" />);

    expect(screen.getByRole("img", { name: "Dune cover" }).parentElement).toHaveClass(
      "cover",
      "large",
    );
  });
});
