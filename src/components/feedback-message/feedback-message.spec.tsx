import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FeedbackMessage from "./feedback-message";

describe("FeedbackMessage", () => {
  it("should render a status message by default", () => {
    render(<FeedbackMessage>Saved</FeedbackMessage>);

    const message = screen.getByRole("status");
    expect(message).toHaveTextContent("Saved");
    expect(message).toHaveClass("message");
    expect(message).not.toHaveClass("error");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should render an alert for the error tone", () => {
    render(<FeedbackMessage tone="error">Something went wrong</FeedbackMessage>);

    const message = screen.getByRole("alert");
    expect(message).toHaveTextContent("Something went wrong");
    expect(message).toHaveClass("message", "error");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should merge a custom class name", () => {
    render(<FeedbackMessage className="inline">Saved</FeedbackMessage>);

    expect(screen.getByRole("status")).toHaveClass("message", "inline");
  });

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an empty string", ""],
  ])("should render nothing when children is %s", (_, children) => {
    const { container } = render(<FeedbackMessage tone="error">{children}</FeedbackMessage>);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should render the number zero", () => {
    render(<FeedbackMessage>{0}</FeedbackMessage>);

    expect(screen.getByRole("status")).toHaveTextContent("0");
  });
});
