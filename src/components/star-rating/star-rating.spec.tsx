import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithIntl, t } from "@/test/utils";
import StarRating from "./star-rating";

function Harness({
  initialValue = null,
  disabled,
}: {
  initialValue?: number | null;
  disabled?: boolean;
}) {
  const [value, setValue] = useState<number | null>(initialValue);
  return (
    <>
      <StarRating label="Your rating" value={value} onValueChange={setValue} disabled={disabled} />
      <output aria-label="Current rating">{value === null ? "none" : value}</output>
    </>
  );
}

const starName = (value: number) => t("ratingControl.valueLabel", { value });

describe("StarRating", () => {
  it("should render a labelled group of five stars", () => {
    renderWithIntl(<Harness />);

    expect(screen.getByRole("radiogroup", { name: "Your rating" })).toBeInTheDocument();
    const stars = screen.getAllByRole("radio");
    expect(stars).toHaveLength(5);
    [1, 2, 3, 4, 5].forEach((rating, index) =>
      expect(stars[index]).toHaveAccessibleName(starName(rating)),
    );
    stars.forEach((star) => expect(star).not.toBeChecked());
  });

  it("should check the star matching the current value", () => {
    renderWithIntl(<Harness initialValue={4} />);

    expect(screen.getByRole("radio", { name: starName(4) })).toBeChecked();
    expect(screen.getByRole("radio", { name: starName(3) })).not.toBeChecked();
  });

  it("should announce half-star values on the matching star", () => {
    renderWithIntl(<Harness initialValue={3.5} />);

    const star = screen.getByRole("radio", { name: starName(3.5) });
    expect(star).toBeChecked();
    expect(screen.queryByRole("radio", { name: starName(4) })).not.toBeInTheDocument();
  });

  it("should change the rating with the keyboard in half-star steps", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness initialValue={3} />);

    screen.getByRole("radio", { name: starName(3) }).focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("status", { name: "Current rating" })).toHaveTextContent("3.5");
    expect(screen.getByRole("radio", { name: starName(3.5) })).toBeChecked();
  });

  it("should clear the rating with the clear button", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness initialValue={4} />);

    await user.click(screen.getByRole("button", { name: t("ratingControl.clear") }));

    expect(screen.getByRole("status", { name: "Current rating" })).toHaveTextContent("none");
    screen.getAllByRole("radio").forEach((star) => expect(star).not.toBeChecked());
    expect(screen.getByRole("button", { name: t("ratingControl.clear") })).toBeDisabled();
  });

  it("should disable the clear button when there is no rating", () => {
    renderWithIntl(<Harness />);

    expect(screen.getByRole("button", { name: t("ratingControl.clear") })).toBeDisabled();
  });

  it("should disable the stars and clear button when disabled", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness initialValue={2} disabled />);

    screen.getAllByRole("radio").forEach((star) =>
      expect(star).toHaveAttribute("aria-disabled", "true"),
    );
    expect(screen.getByRole("button", { name: t("ratingControl.clear") })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: starName(5) }));

    expect(screen.getByRole("status", { name: "Current rating" })).toHaveTextContent("2");
  });

  it("should hide the clear button and use the read-only label in read-only mode", () => {
    renderWithIntl(<StarRating label="Average rating" value={4.5} readOnly />);

    expect(
      screen.queryByRole("button", { name: t("ratingControl.clear") }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: starName(4.5) })).toBeChecked();
    expect(screen.getByText("Average rating")).toHaveClass("readOnlyLabel");
  });
});
