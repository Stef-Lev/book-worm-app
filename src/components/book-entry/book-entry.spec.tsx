import { useState } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { BookSource } from "@/lib/book-source";
import { toDateOnly } from "@/lib/dates";
import { Shelf } from "@/lib/shelves";
import { renderWithIntl, t } from "@/test/utils";
import type {
  BookCollection,
  BookEntryData,
  BookEntryProps,
} from "./book-entry.types";
import BookEntry from "./book-entry";const labels: BookEntryProps["labels"] = {
  author: t("libraryWorkspace.author"),
  noAuthor: t("libraryWorkspace.noAuthor"),
  rating: t("libraryWorkspace.rating"),
  noRating: t("libraryWorkspace.noRating"),
  review: t("libraryWorkspace.review"),
  startedAt: t("libraryWorkspace.startedAt"),
  finishedAt: t("libraryWorkspace.finishedAt"),
  status: t("libraryWorkspace.status"),
  collection: t("libraryWorkspace.collection"),
  noCollection: t("libraryWorkspace.noCollection"),
  save: t("libraryWorkspace.save"),
  remove: t("libraryWorkspace.remove"),
  removeTitle: t("libraryWorkspace.removeTitle"),
  confirmRemove: (title) => t("libraryWorkspace.confirmRemove", { title }),
  cancel: t("libraryWorkspace.cancel"),
  saving: t("libraryWorkspace.saving"),
  pages: t("libraryWorkspace.pages"),
  editBookDetails: t("libraryWorkspace.editBookDetails"),
  title: t("libraryWorkspace.title"),
  authors: t("libraryWorkspace.authors"),
  isbn: t("libraryWorkspace.isbn"),
  pageCount: t("libraryWorkspace.pageCount"),
  coverUrl: t("libraryWorkspace.coverUrl"),
  addAuthor: t("libraryWorkspace.addAuthor"),
  close: t("libraryWorkspace.close"),
};

const shelfNames: Record<Shelf, string> = {
  [Shelf.ToRead]: t("libraryWorkspace.shelfToRead"),
  [Shelf.CurrentlyReading]: t("libraryWorkspace.shelfCurrentlyReading"),
  [Shelf.Read]: t("libraryWorkspace.shelfRead"),
  [Shelf.DidNotFinish]: t("libraryWorkspace.shelfDidNotFinish"),
};

const collections: BookCollection[] = [
  { id: "c1", name: "Favourites" },
  { id: "c2", name: "Sci-fi" },
];

function makeEntry(overrides: Partial<BookEntryData> = {}): BookEntryData {
  return {
    id: "e1",
    status: Shelf.ToRead,
    rating: null,
    review: "",
    startedAt: "",
    finishedAt: "",
    collectionIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    book: {
      id: "b1",
      source: BookSource.Manual,
      title: "The Dispossessed",
      authors: ["Ursula K. Le Guin"],
      pageCount: 387,
      categories: ["Fiction", "Science fiction"],
    },
    ...overrides,
  };
}

function Harness({
  initialEntry = makeEntry(),
  busy = false,
}: {
  initialEntry?: BookEntryData;
  busy?: boolean;
}) {
  const [entry, setEntry] = useState<BookEntryData | null>(initialEntry);
  const [saved, setSaved] = useState<BookEntryData | null>(null);
  return (
    <ToastProvider>
      {entry && (
        <BookEntry
          entry={entry}
          collections={collections}
          shelfNames={shelfNames}
          labels={labels}
          onChange={(_id, changes) =>
            setEntry((current) => current && { ...current, ...changes })
          }
          onSave={setSaved}
          onRemove={() => setEntry(null)}
          busy={busy}
        />
      )}
      {saved && (
        <output aria-label="saved entry">
          {[
            `status=${saved.status}`,
            `rating=${saved.rating}`,
            `review=${saved.review}`,
            `startedAt=${saved.startedAt}`,
            `finishedAt=${saved.finishedAt}`,
            `collections=${saved.collectionIds.join(",")}`,
            `title=${saved.bookOverrides?.title ?? ""}`,
          ].join(";")}
        </output>
      )}
    </ToastProvider>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

const statusDropdown = () =>
  screen.getByRole("combobox", { name: labels.status });
const collectionDropdown = () =>
  screen.getByRole("combobox", { name: labels.collection });
const savedEntry = () => screen.getByRole("status", { name: "saved entry" });

async function choose(
  user: ReturnType<typeof userEvent.setup>,
  dropdown: HTMLElement,
  option: string,
) {
  await user.click(dropdown);
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("BookEntry", () => {
  it("should render the book title, authors, pages and categories", () => {
    renderWithIntl(<Harness />);

    expect(
      screen.getByRole("heading", { level: 3, name: "The Dispossessed" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ursula K. Le Guin")).toBeInTheDocument();
    expect(
      screen.getByText(
        `387 ${labels.pages} · Fiction, Science fiction`,
      ),
    ).toBeInTheDocument();
  });

  it("should show a placeholder when the book has no authors", () => {
    renderWithIntl(
      <Harness
        initialEntry={makeEntry({
          book: { ...makeEntry().book, authors: [] },
        })}
      />,
    );

    expect(screen.getByText(labels.noAuthor)).toBeInTheDocument();
  });

  it("should show the current status and collection in the dropdowns", () => {
    renderWithIntl(
      <Harness initialEntry={makeEntry({ collectionIds: ["c2"] })} />,
    );

    expect(statusDropdown()).toHaveTextContent(shelfNames[Shelf.ToRead]);
    expect(collectionDropdown()).toHaveTextContent("Sci-fi");
  });

  it("should hide dates, rating and review for books to read", () => {
    renderWithIntl(<Harness />);

    expect(
      screen.queryByRole("textbox", { name: labels.startedAt }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: labels.finishedAt }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: labels.review }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("radiogroup", { name: labels.rating }),
    ).not.toBeInTheDocument();
  });

  it("should show only the start date for books currently being read", () => {
    renderWithIntl(
      <Harness
        initialEntry={makeEntry({
          status: Shelf.CurrentlyReading,
          startedAt: "2026-03-14",
        })}
      />,
    );

    expect(
      screen.getByRole("textbox", { name: labels.startedAt }),
    ).toHaveValue("14/03/2026");
    expect(
      screen.queryByRole("textbox", { name: labels.finishedAt }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: labels.review }),
    ).not.toBeInTheDocument();
  });

  it("should show dates, rating and review for read books", () => {
    renderWithIntl(
      <Harness
        initialEntry={makeEntry({
          status: Shelf.Read,
          startedAt: "2026-03-14",
          finishedAt: "2026-04-02",
          rating: 4,
          review: "Thoughtful and quiet.",
        })}
      />,
    );

    expect(
      screen.getByRole("textbox", { name: labels.startedAt }),
    ).toHaveValue("14/03/2026");
    expect(
      screen.getByRole("textbox", { name: labels.finishedAt }),
    ).toHaveValue("02/04/2026");
    expect(screen.getByRole("textbox", { name: labels.review })).toHaveValue(
      "Thoughtful and quiet.",
    );
    expect(
      screen.getByRole("radio", {
        name: t("ratingControl.valueLabel", { value: 4 }),
      }),
    ).toBeChecked();
  });

  it("should show rating and review but no dates for unfinished books", () => {
    renderWithIntl(
      <Harness initialEntry={makeEntry({ status: Shelf.DidNotFinish })} />,
    );

    expect(
      screen.getByRole("textbox", { name: labels.review }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: labels.startedAt }),
    ).not.toBeInTheDocument();
  });

  it("should default the start date to today when moved to currently reading", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await choose(user, statusDropdown(), shelfNames[Shelf.CurrentlyReading]);

    expect(statusDropdown()).toHaveTextContent(
      shelfNames[Shelf.CurrentlyReading],
    );
    expect(
      screen.getByRole("textbox", { name: labels.startedAt }),
    ).toHaveValue(formatDate(toDateOnly()));
  });

  it("should keep the start date and default the finish date when marked as read", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Harness
        initialEntry={makeEntry({
          status: Shelf.CurrentlyReading,
          startedAt: "2026-03-14",
        })}
      />,
    );

    await choose(user, statusDropdown(), shelfNames[Shelf.Read]);

    expect(
      screen.getByRole("textbox", { name: labels.startedAt }),
    ).toHaveValue("14/03/2026");
    expect(
      screen.getByRole("textbox", { name: labels.finishedAt }),
    ).toHaveValue(formatDate(toDateOnly()));
    expect(
      screen.getByRole("textbox", { name: labels.review }),
    ).toBeInTheDocument();
  });

  it("should change and clear the collection", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    expect(collectionDropdown()).toHaveTextContent(labels.noCollection);

    await choose(user, collectionDropdown(), "Favourites");
    expect(collectionDropdown()).toHaveTextContent("Favourites");

    await choose(user, collectionDropdown(), labels.noCollection);
    expect(collectionDropdown()).toHaveTextContent(labels.noCollection);
  });

  it("should update the review and rating, then save the edited entry", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <Harness
        initialEntry={makeEntry({
          status: Shelf.Read,
          startedAt: "2026-03-14",
          finishedAt: "2026-04-02",
          rating: 2,
        })}
      />,
    );

    await user.type(
      screen.getByRole("textbox", { name: labels.review }),
      "Loved it",
    );
    await user.click(
      screen.getByRole("button", { name: t("ratingControl.clear") }),
    );

    expect(screen.getByRole("textbox", { name: labels.review })).toHaveValue(
      "Loved it",
    );
    expect(
      screen.getByRole("radio", {
        name: t("ratingControl.valueLabel", { value: 2 }),
      }),
    ).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: labels.save }));

    expect(savedEntry()).toHaveTextContent(
      "status=read;rating=0;review=Loved it;startedAt=2026-03-14;finishedAt=2026-04-02;collections=;title=",
    );
  });

  it("should save book detail overrides edited in the details dialog", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.click(
      screen.getByRole("button", { name: labels.editBookDetails }),
    );
    const dialog = await screen.findByRole("dialog", {
      name: labels.editBookDetails,
    });
    const title = within(dialog).getByRole("textbox", { name: labels.title });
    await user.clear(title);
    await user.type(title, "The Dispossessed: An Ambiguous Utopia");
    await user.click(within(dialog).getByRole("button", { name: labels.save }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: labels.save }));

    expect(savedEntry()).toHaveTextContent(
      "title=The Dispossessed: An Ambiguous Utopia",
    );
  });

  it("should ask for confirmation and keep the book when removal is cancelled", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.click(screen.getByRole("button", { name: labels.remove }));

    const dialog = await screen.findByRole("alertdialog", {
      name: labels.removeTitle,
    });
    expect(dialog).toHaveAccessibleDescription(
      labels.confirmRemove("The Dispossessed"),
    );

    await user.click(within(dialog).getByRole("button", { name: labels.cancel }));

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("heading", { name: "The Dispossessed" }),
    ).toBeInTheDocument();
  });

  it("should remove the book when removal is confirmed", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    await user.click(screen.getByRole("button", { name: labels.remove }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: labels.remove }));

    await waitFor(() =>
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("heading", { name: "The Dispossessed" }),
    ).not.toBeInTheDocument();
  });

  it("should lock the controls while busy", () => {
    renderWithIntl(
      <Harness initialEntry={makeEntry({ status: Shelf.Read })} busy />,
    );

    expect(statusDropdown()).toBeDisabled();
    expect(collectionDropdown()).toBeDisabled();
    expect(screen.getByRole("button", { name: labels.save })).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("button", { name: labels.remove })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: labels.editBookDetails }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: t("ratingControl.clear") }),
    ).toBeDisabled();
  });
});
