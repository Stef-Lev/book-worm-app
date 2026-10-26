"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "@/components/navigation-link/navigation-link";
import RouteLoading from "@/components/route-loading/route-loading";
import {
  BookOpen,
  Check,
  Library,
  Plus,
  ScanBarcode,
  Search,
  RotateCcw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import BookEntry from "@/components/book-entry/book-entry";
import Dropdown from "@/components/dropdown/dropdown";
import Button from "@/components/button/button";
import CollectionsDialog from "@/components/book-library/collections-dialog/collections-dialog";
import TextInput from "@/components/text-input/text-input";
import BookCover from "@/components/book-cover/book-cover";
import FeedbackMessage from "@/components/feedback-message/feedback-message";
import EmptyState from "@/components/book-library/empty-state/empty-state";
import type {
  BookCollection,
  BookEntryData,
  Shelf,
} from "@/components/book-entry/book-entry.types";
import styles from "./book-library.module.css";
import type { BookLibraryProps } from "./book-library.types";

type CatalogBook = {
  source: "open-library" | "manual";
  externalId?: string;
  isbn?: string;
  title: string;
  authors: string[];
  pageCount: number;
  publishedDate?: string;
  categories: string[];
  coverUrl?: string;
};

type LibraryResponse = {
  entries: BookEntryData[];
  collections: BookCollection[];
};
type SearchResponse = { results: CatalogBook[] };
type BarcodeResult = { rawValue: string };
type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeResult[]>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorInstance;

const shelves: Shelf[] = [
  "to-read",
  "currently-reading",
  "read",
  "did-not-finish",
];

async function responseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

function normalizeIsbn(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export default function BookLibrary({
  mode,
  initialQuery = "",
}: BookLibraryProps) {
  const t = useTranslations("libraryWorkspace");
  const isSearch = mode === "search";
  const [entries, setEntries] = useState<BookEntryData[]>([]);
  const [collections, setCollections] = useState<BookCollection[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [results, setResults] = useState<CatalogBook[]>([]);
  const [shelfFilter, setShelfFilter] = useState<Shelf | "all">("all");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [sortBy, setSortBy] = useState("title");
  const [searchShelf, setSearchShelf] = useState<Shelf>("to-read");
  const [searchCollection, setSearchCollection] = useState("");
  const [busyId, setBusyId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [scanRunning, setScanRunning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanCancelled = useRef(false);

  const searchCatalog = useCallback(
    async (searchTerm: string, showLoading = true) => {
      if (showLoading) {
        setError("");
        setMessage("");
        setBusy(true);
      }
      try {
        const params = new URLSearchParams({ q: searchTerm });
        const data = await responseJson<SearchResponse>(
          await fetch(`/api/books/search?${params}`),
        );
        setResults(data.results);
        if (!data.results.length) setMessage(t("noSearchResults"));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : t("genericError"));
        setMessage("");
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  useEffect(() => {
    let active = true;
    fetch("/api/library")
      .then((response) => responseJson<LibraryResponse>(response))
      .then((data) => {
        if (!active) return;
        setEntries(data.entries);
        setCollections(data.collections);
        setLibraryLoaded(true);
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : t("loadError"));
      });
    return () => {
      active = false;
      scanCancelled.current = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [t]);

  useEffect(() => {
    if (!isSearch || initialQuery.trim().length < 2) return;
    let active = true;
    const params = new URLSearchParams({ q: initialQuery });
    fetch(`/api/books/search?${params}`)
      .then((response) => responseJson<SearchResponse>(response))
      .then((data) => {
        if (!active) return;
        setResults(data.results);
        if (!data.results.length) setMessage(t("noSearchResults"));
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : t("genericError"));
      });
    return () => {
      active = false;
    };
  }, [initialQuery, isSearch, t]);

  const shelfNames: Record<Shelf, string> = {
    "to-read": t("shelfToRead"),
    "currently-reading": t("shelfCurrentlyReading"),
    read: t("shelfRead"),
    "did-not-finish": t("shelfDidNotFinish"),
  };

  const visibleEntries = useMemo(() => {
    const search = libraryQuery.trim().toLocaleLowerCase();
    const isbnSearch = normalizeIsbn(libraryQuery);
    const filtered = entries.filter((entry) => {
      const matchesQuery =
        !search ||
        [
          entry.book.title,
          ...entry.book.authors,
          ...entry.book.categories,
          entry.book.isbn ?? "",
        ].some((value) => value.toLocaleLowerCase().includes(search)) ||
        (!!isbnSearch &&
          normalizeIsbn(entry.book.isbn ?? "").includes(isbnSearch));
      return (
        matchesQuery &&
        (shelfFilter === "all" || entry.status === shelfFilter) &&
        (!collectionFilter || entry.collectionIds.includes(collectionFilter)) &&
        (!authorFilter || entry.book.authors.includes(authorFilter)) &&
        (!categoryFilter || entry.book.categories.includes(categoryFilter))
      );
    });
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "author":
          return (a.book.authors[0] ?? "").localeCompare(
            b.book.authors[0] ?? "",
          );
        case "category":
          return (a.book.categories[0] ?? "").localeCompare(
            b.book.categories[0] ?? "",
          );
        case "rating":
          return (b.rating ?? 0) - (a.rating ?? 0);
        case "date-added":
          return b.createdAt.localeCompare(a.createdAt);
        case "date-finished":
          return (b.finishedAt ?? "").localeCompare(a.finishedAt ?? "");
        case "page-count":
          return a.book.pageCount - b.book.pageCount;
        default:
          return a.book.title.localeCompare(b.book.title);
      }
    });
  }, [
    authorFilter,
    categoryFilter,
    collectionFilter,
    entries,
    libraryQuery,
    shelfFilter,
    sortBy,
  ]);

  const authors = [
    ...new Set(entries.flatMap((entry) => entry.book.authors)),
  ].sort((first, second) => first.localeCompare(second));
  const categories = [
    ...new Set(entries.flatMap((entry) => entry.book.categories)),
  ].sort((first, second) => first.localeCompare(second));
  const hasFilters =
    !!libraryQuery ||
    shelfFilter !== "all" ||
    !!collectionFilter ||
    !!authorFilter ||
    !!categoryFilter;

  function isInLibrary(book: CatalogBook) {
    return entries.some(
      (entry) =>
        (book.externalId &&
          entry.book.source === book.source &&
          entry.book.externalId === book.externalId) ||
        (book.isbn &&
          normalizeIsbn(book.isbn) === normalizeIsbn(entry.book.isbn ?? "")),
    );
  }

  function announceError(reason: unknown) {
    setError(reason instanceof Error ? reason.message : t("genericError"));
    setMessage("");
  }

  async function addBook(book: CatalogBook): Promise<boolean> {
    if (isInLibrary(book)) {
      setError(t("inLibrary"));
      return false;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await responseJson(
        await fetch("/api/library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            book,
            status: searchShelf,
            collectionIds: searchCollection ? [searchCollection] : [],
          }),
        }),
      );
      const data = await responseJson<LibraryResponse>(
        await fetch("/api/library"),
      );
      setEntries(data.entries);
      setMessage(t("bookAdded"));
      return true;
    } catch (reason) {
      announceError(reason);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function createManualBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = String(form.get("title") ?? "").trim();
    const author = String(form.get("author") ?? "").trim();
    const book: CatalogBook = {
      source: "manual",
      title,
      authors: author ? [author] : [],
      isbn: String(form.get("isbn") ?? "").trim() || undefined,
      pageCount: Number(form.get("pageCount") ?? 0) || 0,
      categories: String(form.get("categories") ?? "")
        .split(",")
        .map((category) => category.trim())
        .filter(Boolean),
      coverUrl: String(form.get("coverUrl") ?? "").trim() || undefined,
    };
    if (await addBook(book)) formElement.reset();
  }

  async function saveEntry(entry: BookEntryData) {
    setBusyId(entry.id);
    setError("");
    setMessage("");
    try {
      await responseJson(
        await fetch(`/api/library/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: entry.status,
            rating: entry.rating,
            review: entry.review,
            startedAt: entry.startedAt,
            finishedAt: entry.finishedAt,
            collectionIds: entry.collectionIds,
          }),
        }),
      );
      const data = await responseJson<LibraryResponse>(
        await fetch("/api/library"),
      );
      setEntries(data.entries);
      setMessage(t("changesSaved"));
    } catch (reason) {
      announceError(reason);
    } finally {
      setBusyId("");
    }
  }

  async function removeEntry(entry: BookEntryData) {
    setBusyId(entry.id);
    setError("");
    setMessage("");
    try {
      await responseJson(
        await fetch(`/api/library/${entry.id}`, { method: "DELETE" }),
      );
      setEntries((previous) => previous.filter((item) => item.id !== entry.id));
      setMessage(t("bookRemoved"));
    } catch (reason) {
      announceError(reason);
    } finally {
      setBusyId("");
    }
  }

  async function stopScanner() {
    scanCancelled.current = true;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setScanRunning(false);
  }

  async function startScanner() {
    setError("");
    setMessage("");
    const detectorClass = (
      window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;
    if (!detectorClass || !navigator.mediaDevices?.getUserMedia) {
      setError(t("scannerUnsupported"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      scanCancelled.current = false;
      setScanRunning(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      const detector = new detectorClass({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e"],
      });
      while (!scanCancelled.current && videoRef.current) {
        const detected = await detector.detect(videoRef.current);
        const isbn = detected[0]?.rawValue;
        if (isbn) {
          await stopScanner();
          setQuery(isbn);
          await searchCatalog(isbn);
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
    } catch (reason) {
      await stopScanner();
      announceError(
        reason instanceof Error ? reason : new Error(t("scannerError")),
      );
    }
  }

  const entryLabels = {
    author: t("author"),
    noAuthor: t("noAuthor"),
    rating: t("rating"),
    noRating: t("noRating"),
    review: t("review"),
    startedAt: t("startedAt"),
    finishedAt: t("finishedAt"),
    status: t("status"),
    collection: t("collection"),
    noCollection: t("noCollection"),
    save: t("save"),
    remove: t("remove"),
    removeTitle: t("removeTitle"),
    confirmRemove: (title: string) => t("confirmRemove", { title }),
    cancel: t("cancel"),
    saving: t("saving"),
    pages: t("pages"),
  };

  return (
    <main className={styles.main}>
      {!libraryLoaded && !error && <RouteLoading />}
      <section className={styles.hero}>
        <span className={styles.heroIcon}>
          <BookOpen aria-hidden="true" />
        </span>
        <div>
          <h1 className={styles.heading}>
            {isSearch ? t("addBooks") : t("title")}
          </h1>
        </div>
      </section>

      <FeedbackMessage tone="error">{error}</FeedbackMessage>
      <FeedbackMessage>{message}</FeedbackMessage>

      {isSearch && (
        <section className={styles.panel} aria-labelledby="catalog-heading">
          <h2 className={styles.sectionTitle} id="catalog-heading">
            <Search aria-hidden="true" />
            {t("addBooks")}
          </h2>
          <form
            className={styles.searchForm}
            onSubmit={(event) => {
              event.preventDefault();
              void searchCatalog(query);
            }}
          >
            <TextInput
              label={t("searchBooks")}
              fieldClassName={styles.field}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
            />
            <Button type="submit" loading={busy}>
              <Search aria-hidden="true" />
              {t("search")}
            </Button>
            {scanRunning ? (
              <Button variant="secondary" onClick={() => void stopScanner()}>
                <ScanBarcode aria-hidden="true" />
                {t("stopScan")}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => void startScanner()}>
                <ScanBarcode aria-hidden="true" />
                {t("scanBarcode")}
              </Button>
            )}
          </form>
          <video
            ref={videoRef}
            className={scanRunning ? styles.scannerVideo : styles.hidden}
            muted
            playsInline
          />
          <div className={styles.row}>
            <Dropdown
              label={t("addToShelf")}
              fieldClassName={styles.field}
              value={searchShelf}
              onValueChange={(value) => setSearchShelf(value as Shelf)}
              options={shelves.map((shelf) => ({
                value: shelf,
                label: shelfNames[shelf],
              }))}
            />
            <Dropdown
              label={t("addToCollection")}
              fieldClassName={styles.field}
              value={searchCollection}
              onValueChange={setSearchCollection}
              options={[
                { value: "", label: t("noCollection") },
                ...collections.map((collection) => ({
                  value: collection.id,
                  label: collection.name,
                })),
              ]}
            />
          </div>
          {!!results.length && (
            <div className={styles.results}>
              {results.map((book) => (
                <article className={styles.result} key={book.externalId}>
                  <BookCover className={styles.cover} src={book.coverUrl} />
                  <div>
                    <h3 className={styles.title}>{book.title}</h3>
                    <p className={styles.details}>
                      {book.authors.join(", ") || t("noAuthor")}
                      {book.pageCount
                        ? ` · ${book.pageCount} ${t("pages")}`
                        : ""}
                      {book.categories.length
                        ? ` · ${book.categories.slice(0, 2).join(", ")}`
                        : ""}
                    </p>
                    <Button
                      className={styles.addButton}
                      disabled={busy || !libraryLoaded || isInLibrary(book)}
                      onClick={() => void addBook(book)}
                    >
                      {isInLibrary(book) ? (
                        <Check aria-hidden="true" />
                      ) : (
                        <Plus aria-hidden="true" />
                      )}
                      {isInLibrary(book) ? t("inLibrary") : t("addBook")}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <details className={styles.manualDetails}>
            <summary>{t("manualAdd")}</summary>
            <form
              className={styles.manualForm}
              onSubmit={(event) => void createManualBook(event)}
            >
              <TextInput
                label={t("titleField")}
                fieldClassName={styles.field}
                name="title"
                required
                maxLength={300}
              />
              <TextInput
                label={t("author")}
                fieldClassName={styles.field}
                name="author"
              />
              <TextInput
                label={t("isbn")}
                fieldClassName={styles.field}
                name="isbn"
              />
              <TextInput
                label={t("pages")}
                fieldClassName={styles.field}
                name="pageCount"
                type="number"
                min="0"
                step="1"
              />
              <TextInput
                label={t("categories")}
                fieldClassName={styles.field}
                name="categories"
                placeholder={t("categoryHint")}
              />
              <TextInput
                label={t("coverUrl")}
                fieldClassName={styles.field}
                name="coverUrl"
                type="url"
              />
              <Button type="submit" disabled={busy || !libraryLoaded}>
                {t("addBook")}
              </Button>
            </form>
          </details>
        </section>
      )}

      {!isSearch && (
        <>
          <section
            className={`${styles.panel} ${styles.libraryPanel}`}
            aria-labelledby="library-heading"
          >
            <div className={styles.libraryHeader}>
              <h2 className={styles.sectionTitle} id="library-heading">
                <Library aria-hidden="true" />
                {t("yourLibrary")}
              </h2>
              <CollectionsDialog
                collections={collections}
                onChange={setCollections}
                disabled={!libraryLoaded}
                onDeleted={(id) => {
                  setEntries((previous) =>
                    previous.map((entry) => ({
                      ...entry,
                      collectionIds: entry.collectionIds.filter(
                        (collectionId) => collectionId !== id,
                      ),
                    })),
                  );
                  if (collectionFilter === id) setCollectionFilter("");
                  if (searchCollection === id) setSearchCollection("");
                }}
              />
            </div>
            <TextInput
              label={t("searchLibrary")}
              fieldClassName={styles.field}
              type="search"
              value={libraryQuery}
              placeholder={t("librarySearchPlaceholder")}
              onChange={(event) => setLibraryQuery(event.target.value)}
            />
            <Dropdown
              label={t("status")}
              fieldClassName={styles.field}
              value={shelfFilter}
              onValueChange={(value) => {
                if (value === "all") setShelfFilter("all");
                else {
                  const shelf = shelves.find((shelf) => shelf === value);
                  if (shelf) setShelfFilter(shelf);
                }
              }}
              options={[
                { value: "all", label: `${t("allBooks")} (${entries.length})` },
                ...shelves.map((shelf) => ({
                  value: shelf,
                  label: `${shelfNames[shelf]} (${entries.filter((entry) => entry.status === shelf).length})`,
                })),
              ]}
            />
            <div className={styles.toolbar}>
              <Dropdown
                label={t("filterAuthor")}
                fieldClassName={styles.field}
                value={authorFilter}
                onValueChange={setAuthorFilter}
                options={[
                  { value: "", label: t("allAuthors") },
                  ...authors.map((author) => ({
                    value: author,
                    label: author,
                  })),
                ]}
              />
              <Dropdown
                label={t("filterCategory")}
                fieldClassName={styles.field}
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                options={[
                  { value: "", label: t("allCategories") },
                  ...categories.map((category) => ({
                    value: category,
                    label: category,
                  })),
                ]}
              />
              <Dropdown
                label={t("filterCollection")}
                fieldClassName={styles.field}
                value={collectionFilter}
                onValueChange={setCollectionFilter}
                options={[
                  { value: "", label: t("allCollections") },
                  ...collections.map((collection) => ({
                    value: collection.id,
                    label: collection.name,
                  })),
                ]}
              />
              <Dropdown
                label={t("sortBy")}
                fieldClassName={styles.field}
                value={sortBy}
                onValueChange={setSortBy}
                options={[
                  { value: "title", label: t("sortTitle") },
                  { value: "author", label: t("sortAuthor") },
                  { value: "category", label: t("sortCategory") },
                  { value: "rating", label: t("sortRating") },
                  { value: "date-added", label: t("sortDateAdded") },
                  { value: "date-finished", label: t("sortDateFinished") },
                  { value: "page-count", label: t("sortPageCount") },
                ]}
              />
            </div>
            {hasFilters && (
              <Button
                variant="secondary"
                className={styles.resetButton}
                onClick={() => {
                  setLibraryQuery("");
                  setShelfFilter("all");
                  setCollectionFilter("");
                  setAuthorFilter("");
                  setCategoryFilter("");
                }}
              >
                <RotateCcw aria-hidden="true" />
                {t("clearFilters")}
              </Button>
            )}
            {!libraryLoaded ? (
              <p role="status">
                {error ? t("loadError") : t("loadingLibrary")}
              </p>
            ) : entries.length ? (
              <div className={styles.entries}>
                {visibleEntries.map((entry) => (
                  <BookEntry
                    key={entry.id}
                    entry={entry}
                    collections={collections}
                    shelfNames={shelfNames}
                    labels={entryLabels}
                    onChange={(id, changes) =>
                      setEntries((previous) =>
                        previous.map((item) =>
                          item.id === id ? { ...item, ...changes } : item,
                        ),
                      )
                    }
                    onSave={(changed) => void saveEntry(changed)}
                    onRemove={(removed) => void removeEntry(removed)}
                    busy={busyId === entry.id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon={<BookOpen aria-hidden="true" />}>
                {t("emptyLibrary")}
                <Link href="/search">{t("addBooks")}</Link>
              </EmptyState>
            )}
            {!!entries.length && !visibleEntries.length && (
              <EmptyState icon={<Search aria-hidden="true" />}>
                {t("noBooksMatch")}
              </EmptyState>
            )}
          </section>
        </>
      )}
    </main>
  );
}
