import { useState } from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderWithIntl, t } from "@/test/utils";
import DateInput from "./date-input";

function Harness({
  initialValue = "",
  disabled,
}: {
  initialValue?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  return (
    <>
      <DateInput label="Started on" value={value} onValueChange={setValue} disabled={disabled} />
      <output aria-label="Stored date">{value || "none"}</output>
    </>
  );
}

describe("DateInput", () => {
  it("should render a labelled, empty input with a placeholder", () => {
    renderWithIntl(<Harness />);

    const input = screen.getByRole("textbox", { name: "Started on" });
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("placeholder", t("dateInput.placeholder"));
  });

  it("should display the ISO value in day/month/year format", () => {
    renderWithIntl(<Harness initialValue="2024-03-05" />);

    expect(screen.getByRole("textbox", { name: "Started on" })).toHaveValue("05/03/2024");
  });

  it("should store a typed date as an ISO value", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.type(screen.getByRole("textbox", { name: "Started on" }), "17/11/2023");
    await user.tab();

    expect(screen.getByRole("status", { name: "Stored date" })).toHaveTextContent("2023-11-17");
    expect(screen.getByRole("textbox", { name: "Started on" })).toHaveValue("17/11/2023");
  });

  it("should keep the current date when an invalid date is typed", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness initialValue="2024-03-05" />);

    await user.type(screen.getByRole("textbox", { name: "Started on" }), "31/02/2023", {
      initialSelectionStart: 0,
      initialSelectionEnd: 10,
    });
    await user.tab();

    expect(screen.getByRole("status", { name: "Stored date" })).toHaveTextContent("2024-03-05");
    expect(screen.getByRole("textbox", { name: "Started on" })).toHaveValue("05/03/2024");
  });

  it("should open the calendar when the input is clicked", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness initialValue="2024-03-05" />);

    await user.click(screen.getByRole("textbox", { name: "Started on" }));

    expect(screen.getByRole("application", { name: "Started on" })).toBeVisible();
    expect(screen.getByRole("grid", { name: "March 2024" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("dateInput.previous") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("dateInput.next") })).toBeInTheDocument();
  });

  it("should select a day from the calendar", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness initialValue="2024-03-05" />);

    await user.click(screen.getByRole("textbox", { name: "Started on" }));
    await user.click(screen.getByRole("button", { name: /March 12, 2024/ }));

    expect(screen.getByRole("status", { name: "Stored date" })).toHaveTextContent("2024-03-12");
    expect(screen.getByRole("textbox", { name: "Started on" })).toHaveValue("12/03/2024");
  });

  it("should navigate to the next month", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness initialValue="2024-03-05" />);

    await user.click(screen.getByRole("textbox", { name: "Started on" }));
    await user.click(screen.getByRole("button", { name: t("dateInput.next") }));

    expect(screen.getByRole("grid", { name: "April 2024" })).toBeInTheDocument();
  });

  it("should switch to the month view", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness initialValue="2024-03-05" />);

    await user.click(screen.getByRole("textbox", { name: "Started on" }));
    await user.click(screen.getByRole("button", { name: t("dateInput.changeView") }));

    expect(screen.getByRole("button", { name: /Mar/ })).toBeInTheDocument();
    expect(screen.queryByRole("grid", { name: "March 2024" })).not.toBeInTheDocument();
  });

  it("should clear the value when the input is emptied", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness initialValue="2024-03-05" />);

    await user.clear(screen.getByRole("textbox", { name: "Started on" }));
    await user.tab();

    expect(screen.getByRole("status", { name: "Stored date" })).toHaveTextContent("none");
  });

  it("should not accept input when disabled", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness disabled />);

    const input = screen.getByRole("textbox", { name: "Started on" });
    expect(input).toBeDisabled();
    await user.type(input, "17/11/2023{Enter}");

    expect(input).toHaveValue("");
    expect(screen.getByRole("status", { name: "Stored date" })).toHaveTextContent("none");
  });
});
