import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BookEntryData } from "@/components/book-entry/book-entry.types";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { BookSource } from "@/lib/book-source";
import { Shelf } from "@/lib/shelves";
import { renderWithIntl, t } from "@/test/utils";
import LibraryPage from "./library-page";
import type { LibraryPageProps } from "./library-page.types";

function makeEntry(
  id: string,
  title: string,
  author: string,
  status: Shelf,
): BookEntryData {
  return {
    id,
    status,
    rating: null,
    review: "",
    startedAt: "",
    finishedAt: "",
    collectionIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    book: {
      id: `book-${id}`,
      source: BookSource.Manual,
      title,
      authors: [author],
      pageCount: 300,
      categories: [],
    },
  };
}

const entries = [
  makeEntry("1", "Dune", "Frank Herbert", Shelf.Read),
  makeEntry("2", "Emma", "Jane Austen", Shelf.ToRead),
];

// In-memory stand-in for GET /api/library.
function stubLibraryApi(response: () => Response) {
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) =>
    String(input) === "/api/library"
      ? response()
      : new Response(null, { status: 404 }),
  );
}

async function renderPage(params: Awaited<LibraryPageProps["searchParams"]>) {
  const page = await LibraryPage({ searchParams: Promise.resolve(params) });
  return renderWithIntl(<ToastProvider>{page}</ToastProvider>);
}

describe("LibraryPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should render the library heading and the user's books", async () => {
    stubLibraryApi(() => Response.json({ entries, collections: [] }));
    await renderPage({});

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      t("libraryWorkspace.title"),
    );
    expect(
      await screen.findByRole("heading", { level: 3, name: "Dune" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Emma" }),
    ).toBeInTheDocument();
  });

  it("should show a loading status until the library loads", async () => {
    stubLibraryApi(() => Response.json({ entries, collections: [] }));
    await renderPage({});

    expect(
      screen.getByText(t("libraryWorkspace.loadingLibrary")),
    ).toHaveAttribute("role", "status");
    expect(
      await screen.findByRole("heading", { level: 3, name: "Dune" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(t("libraryWorkspace.loadingLibrary")),
    ).not.toBeInTheDocument();
  });

  it("should prefill the library search from the q parameter", async () => {
    stubLibraryApi(() => Response.json({ entries, collections: [] }));
    await renderPage({ q: "dune" });

    expect(
      screen.getByRole("searchbox", { name: t("libraryWorkspace.searchLibrary") }),
    ).toHaveValue("dune");
    expect(
      await screen.findByRole("heading", { level: 3, name: "Dune" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: "Emma" }),
    ).not.toBeInTheDocument();
  });

  it("should apply the status filter from the URL", async () => {
    stubLibraryApi(() => Response.json({ entries, collections: [] }));
    await renderPage({ status: Shelf.ToRead });

    expect(
      await screen.findByRole("heading", { level: 3, name: "Emma" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: "Dune" }),
    ).not.toBeInTheDocument();
  });

  it("should use the first value when a parameter is repeated", async () => {
    stubLibraryApi(() => Response.json({ entries, collections: [] }));
    await renderPage({ q: ["emma", "dune"] });

    expect(
      screen.getByRole("searchbox", { name: t("libraryWorkspace.searchLibrary") }),
    ).toHaveValue("emma");
    expect(
      await screen.findByRole("heading", { level: 3, name: "Emma" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 3, name: "Dune" }),
    ).not.toBeInTheDocument();
  });

  it("should show the empty state when the library has no books", async () => {
    stubLibraryApi(() => Response.json({ entries: [], collections: [] }));
    await renderPage({});

    expect(
      await screen.findByText(t("libraryWorkspace.emptyLibrary")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: t("libraryWorkspace.addBooks") }),
    ).toHaveAttribute("href", "/search");
  });

  it("should show an error when the library fails to load", async () => {
    stubLibraryApi(() =>
      Response.json({ error: "Library unavailable" }, { status: 500 }),
    );
    await renderPage({});

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Library unavailable",
    );
  });
});
