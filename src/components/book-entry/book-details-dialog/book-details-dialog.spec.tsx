import { useState } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { renderWithIntl, t } from "@/test/utils";
import type { BookDetailsDialogProps } from "./book-details-dialog.types";
import BookDetailsDialog from "./book-details-dialog";

const labels: BookDetailsDialogProps["labels"] = {
  editBookDetails: t("libraryWorkspace.editBookDetails"),
  title: t("libraryWorkspace.title"),
  authors: t("libraryWorkspace.authors"),
  isbn: t("libraryWorkspace.isbn"),
  pageCount: t("libraryWorkspace.pageCount"),
  coverUrl: t("libraryWorkspace.coverUrl"),
  addAuthor: t("libraryWorkspace.addAuthor"),
  pages: t("libraryWorkspace.pages"),
  save: t("libraryWorkspace.save"),
  cancel: t("libraryWorkspace.cancel"),
  close: t("libraryWorkspace.close"),
};

const book: BookDetailsDialogProps["entry"]["book"] = {
  title: "The Dispossessed",
  authors: ["Ursula K. Le Guin"],
  isbn: "9780060512750",
  pageCount: 387,
  coverUrl: "https://covers.example.com/dispossessed.jpg",
};

const pageCountLabel = `${labels.pageCount} (${labels.pages})`;

function Harness({
  initialOverrides,
  busy = false,
  asIconButton,
}: {
  initialOverrides?: BookDetailsDialogProps["entry"]["bookOverrides"];
  busy?: boolean;
  asIconButton?: boolean;
}) {
  const [overrides, setOverrides] = useState(initialOverrides ?? {});
  return (
    <ToastProvider>
      <BookDetailsDialog
        entry={{ id: "e1", book, bookOverrides: initialOverrides }}
        labels={labels}
        onSave={setOverrides}
        busy={busy}
        asIconButton={asIconButton}
      />
      <ul aria-label="overridden fields">
        {Object.entries(overrides).map(([key, value]) => (
          <li key={key}>{`${key}=${JSON.stringify(value)}`}</li>
        ))}
      </ul>
    </ToastProvider>
  );
}

function expectOverriddenFields(expected: string[]) {
  const items = within(
    screen.getByRole("list", { name: "overridden fields" }),
  ).queryAllByRole("listitem");
  expect(items).toHaveLength(expected.length);
  expected.forEach((text, index) =>
    expect(items[index]).toHaveTextContent(text),
  );
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: labels.editBookDetails }));
  return screen.findByRole("dialog", { name: labels.editBookDetails });
}

async function waitForClose() {
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
}

describe("BookDetailsDialog", () => {
  it("should render a text trigger button by default", () => {
    renderWithIntl(<Harness />);

    expect(
      screen.getByRole("button", { name: labels.editBookDetails }),
    ).toHaveTextContent(labels.editBookDetails);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should render an icon trigger button with an accessible label", () => {
    renderWithIntl(<Harness asIconButton />);

    const trigger = screen.getByRole("button", {
      name: labels.editBookDetails,
    });
    expect(trigger).toHaveAttribute("title", labels.editBookDetails);
    expect(trigger).toHaveTextContent("");
  });

  it("should disable the trigger when busy", () => {
    renderWithIntl(<Harness busy />);

    expect(
      screen.getByRole("button", { name: labels.editBookDetails }),
    ).toBeDisabled();
  });

  it("should prefill the form with the book details", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    const dialog = await openDialog(user);

    expect(
      within(dialog).getByRole("textbox", { name: labels.title }),
    ).toHaveValue(book.title);
    expect(
      within(dialog).getByRole("textbox", { name: labels.authors }),
    ).toHaveValue("Ursula K. Le Guin");
    expect(
      within(dialog).getByRole("textbox", { name: labels.isbn }),
    ).toHaveValue(book.isbn);
    expect(
      within(dialog).getByRole("spinbutton", { name: pageCountLabel }),
    ).toHaveValue(387);
    expect(
      within(dialog).getByRole("textbox", { name: labels.coverUrl }),
    ).toHaveValue(book.coverUrl);
  });

  it("should prefer existing overrides when prefilling the form", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Harness
        initialOverrides={{
          title: "Dispossessed",
          authors: ["Le Guin", "Editor"],
          pageCount: 0,
        }}
      />,
    );

    const dialog = await openDialog(user);

    expect(
      within(dialog).getByRole("textbox", { name: labels.title }),
    ).toHaveValue("Dispossessed");
    expect(
      within(dialog).getByRole("textbox", { name: labels.authors }),
    ).toHaveValue("Le Guin, Editor");
    expect(
      within(dialog).getByRole("spinbutton", { name: pageCountLabel }),
    ).toHaveValue(0);
  });

  it("should disable saving when the title is blank", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);
    const title = within(dialog).getByRole("textbox", { name: labels.title });

    await user.clear(title);
    await user.type(title, "   ");

    expect(
      within(dialog).getByRole("button", { name: labels.save }),
    ).toBeDisabled();
  });

  it("should save only the fields that differ from the book and close", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);

    const title = within(dialog).getByRole("textbox", { name: labels.title });
    await user.clear(title);
    await user.type(title, "The Dispossessed: An Ambiguous Utopia");
    const authors = within(dialog).getByRole("textbox", {
      name: labels.authors,
    });
    await user.clear(authors);
    await user.type(authors, " Ursula K. Le Guin , , Afterword Author ");
    await user.clear(
      within(dialog).getByRole("textbox", { name: labels.isbn }),
    );
    await user.click(within(dialog).getByRole("button", { name: labels.save }));

    await waitForClose();
    expectOverriddenFields([
      'title="The Dispossessed: An Ambiguous Utopia"',
      'authors=["Ursula K. Le Guin","Afterword Author"]',
      "isbn=undefined",
    ]);
  });

  it("should save no overrides when nothing changed", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness initialOverrides={{ title: "Old override" }} />);
    const dialog = await openDialog(user);

    const title = within(dialog).getByRole("textbox", { name: labels.title });
    await user.clear(title);
    await user.type(title, book.title);
    await user.click(within(dialog).getByRole("button", { name: labels.save }));

    await waitForClose();
    expectOverriddenFields([]);
  });

  it("should fall back to zero pages when the page count is cleared", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);
    const pages = within(dialog).getByRole("spinbutton", {
      name: pageCountLabel,
    });

    await user.clear(pages);
    expect(pages).toHaveValue(0);

    await user.click(within(dialog).getByRole("button", { name: labels.save }));

    await waitForClose();
    expectOverriddenFields(["pageCount=0"]);
  });

  it("should save a new page count as a number when submitted with enter", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);
    const pages = within(dialog).getByRole("spinbutton", {
      name: pageCountLabel,
    });

    await user.tripleClick(pages);
    await user.keyboard("412{Enter}");

    await waitForClose();
    expectOverriddenFields(["pageCount=412"]);
  });

  it("should discard edits when cancelled", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    let dialog = await openDialog(user);

    const title = within(dialog).getByRole("textbox", { name: labels.title });
    await user.clear(title);
    await user.type(title, "Draft title");
    await user.click(
      within(dialog).getByRole("button", { name: labels.cancel }),
    );
    await waitForClose();

    expectOverriddenFields([]);

    dialog = await openDialog(user);
    expect(
      within(dialog).getByRole("textbox", { name: labels.title }),
    ).toHaveValue(book.title);
  });

  it("should discard edits when closed with the close button", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    let dialog = await openDialog(user);

    const isbn = within(dialog).getByRole("textbox", { name: labels.isbn });
    await user.clear(isbn);
    await user.type(isbn, "123");
    await user.click(within(dialog).getByRole("button", { name: labels.close }));
    await waitForClose();

    dialog = await openDialog(user);
    expect(
      within(dialog).getByRole("textbox", { name: labels.isbn }),
    ).toHaveValue(book.isbn);
  });

  it("should lock the form while busy", async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithIntl(<Harness />);
    await openDialog(user);

    rerender(<Harness busy />);

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("textbox", { name: labels.title }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: labels.cancel }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: labels.close }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: labels.save }),
    ).toHaveAttribute("aria-busy", "true");

    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
