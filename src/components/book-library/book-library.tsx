"use client";

/* eslint-disable @next/next/no-img-element -- Cover URLs are supplied by Open Library or by the user. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, FolderOpen, Library, Plus, ScanBarcode, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import BookEntry from "@/components/book-entry/book-entry";
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

type LibraryResponse = { entries: BookEntryData[]; collections: BookCollection[] };
type SearchResponse = { results: CatalogBook[] };
type BarcodeResult = { rawValue: string };
type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeResult[]>;
};
type BarcodeDetectorConstructor = new (options: { formats: string[] }) => BarcodeDetectorInstance;

const shelves: Shelf[] = ["to-read", "currently-reading", "read", "did-not-finish"];

async function responseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

export default function BookLibrary({ initialQuery = "" }: BookLibraryProps) {
  const t = useTranslations("libraryWorkspace");
  const [entries, setEntries] = useState<BookEntryData[]>([]);
  const [collections, setCollections] = useState<BookCollection[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<CatalogBook[]>([]);
  const [shelfFilter, setShelfFilter] = useState<Shelf | "all">("all");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [searchShelf, setSearchShelf] = useState<Shelf>("to-read");
  const [searchCollection, setSearchCollection] = useState("");
  const [busyId, setBusyId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [scanRunning, setScanRunning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanCancelled = useRef(false);

  const searchCatalog = useCallback(async (searchTerm: string, showLoading = true) => {
    if (showLoading) {
      setError("");
      setMessage("");
      setBusy(true);
    }
    try {
      const params = new URLSearchParams({ q: searchTerm });
      const data = await responseJson<SearchResponse>(await fetch(`/api/books/search?${params}`));
      setResults(data.results);
      if (!data.results.length) setMessage(t("noSearchResults"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("genericError"));
      setMessage("");
    } finally {
      setBusy(false);
    }
  }, [t]);

  useEffect(() => {
    let active = true;
    fetch("/api/library")
      .then((response) => responseJson<LibraryResponse>(response))
      .then((data) => {
        if (!active) return;
        setEntries(data.entries);
        setCollections(data.collections);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : t("loadError"));
      });
    return () => {
      active = false;
      scanCancelled.current = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [t]);

  useEffect(() => {
    if (initialQuery.trim().length < 2) return;
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
  }, [initialQuery, t]);

  const shelfNames: Record<Shelf, string> = {
    "to-read": t("shelfToRead"),
    "currently-reading": t("shelfCurrentlyReading"),
    read: t("shelfRead"),
    "did-not-finish": t("shelfDidNotFinish"),
  };

  const visibleEntries = useMemo(() => {
    const filtered = entries.filter((entry) => {
      const search = query.trim().toLocaleLowerCase();
      const matchesQuery =
        !search ||
        [
          entry.book.title,
          ...entry.book.authors,
          ...entry.book.categories,
          entry.book.isbn ?? "",
        ].some((value) => value.toLocaleLowerCase().includes(search));
      return (
        matchesQuery &&
        (shelfFilter === "all" || entry.status === shelfFilter) &&
        (!collectionFilter || entry.collectionIds.includes(collectionFilter))
      );
    });
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "author":
          return (a.book.authors[0] ?? "").localeCompare(b.book.authors[0] ?? "");
        case "category":
          return (a.book.categories[0] ?? "").localeCompare(b.book.categories[0] ?? "");
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
  }, [collectionFilter, entries, query, shelfFilter, sortBy]);

  function announceError(reason: unknown) {
    setError(reason instanceof Error ? reason.message : t("genericError"));
    setMessage("");
  }

  async function addBook(book: CatalogBook): Promise<boolean> {
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
        })
      );
      const data = await responseJson<LibraryResponse>(await fetch("/api/library"));
      setEntries(data.entries);
      setResults((previous) => previous.filter((result) => result.externalId !== book.externalId));
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
        })
      );
      const data = await responseJson<LibraryResponse>(await fetch("/api/library"));
      setEntries(data.entries);
      setMessage(t("changesSaved"));
    } catch (reason) {
      announceError(reason);
    } finally {
      setBusyId("");
    }
  }

  async function removeEntry(entry: BookEntryData) {
    if (!window.confirm(t("confirmRemove", { title: entry.book.title }))) return;
    setBusyId(entry.id);
    try {
      await responseJson(
        await fetch(`/api/library/${entry.id}`, { method: "DELETE" })
      );
      setEntries((previous) => previous.filter((item) => item.id !== entry.id));
      setMessage(t("bookRemoved"));
    } catch (reason) {
      announceError(reason);
    } finally {
      setBusyId("");
    }
  }

  async function createCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await responseJson<{ collection: BookCollection }>(
        await fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: collectionName }),
        })
      );
      setCollections((previous) =>
        [...previous, response.collection].sort((a, b) => a.name.localeCompare(b.name))
      );
      setCollectionName("");
      setMessage(t("collectionCreated"));
    } catch (reason) {
      announceError(reason);
    }
  }

  async function deleteCollection(collection: BookCollection) {
    if (!window.confirm(t("confirmDeleteCollection", { name: collection.name }))) return;
    try {
      await responseJson(
        await fetch(`/api/collections/${collection.id}`, { method: "DELETE" })
      );
      setCollections((previous) => previous.filter((item) => item.id !== collection.id));
      setEntries((previous) =>
        previous.map((entry) => ({
          ...entry,
          collectionIds: entry.collectionIds.filter((id) => id !== collection.id),
        }))
      );
      if (collectionFilter === collection.id) setCollectionFilter("");
      setMessage(t("collectionDeleted"));
    } catch (reason) {
      announceError(reason);
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
    const detectorClass = (window as Window & { BarcodeDetector?: BarcodeDetectorConstructor })
      .BarcodeDetector;
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
      const detector = new detectorClass({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
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
      announceError(reason instanceof Error ? reason : new Error(t("scannerError")));
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
    collections: t("collections"),
    save: t("save"),
    remove: t("remove"),
    saving: t("saving"),
    pages: t("pages"),
  };

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <span className={styles.heroIcon}><BookOpen aria-hidden="true" /></span>
        <div>
        <h1 className={styles.heading}>{t("title")}</h1>
        <p className={styles.muted}>{t("description")}</p>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="catalog-heading">
        <h2 className={styles.sectionTitle} id="catalog-heading"><Search aria-hidden="true" />{t("addBooks")}</h2>
        <form
          className={styles.row}
          onSubmit={(event) => {
            event.preventDefault();
            void searchCatalog(query);
          }}
        >
          <label className={styles.field}>
            {t("searchBooks")}
            <input
              className={styles.input}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
            />
          </label>
          <button className={styles.button} type="submit" disabled={busy}>
            <Search aria-hidden="true" />
            {busy ? t("searching") : t("search")}
          </button>
          {scanRunning ? (
            <button className={`${styles.button} ${styles.secondaryButton}`} type="button" onClick={() => void stopScanner()}>
              <ScanBarcode aria-hidden="true" />
              {t("stopScan")}
            </button>
          ) : (
            <button className={`${styles.button} ${styles.secondaryButton}`} type="button" onClick={() => void startScanner()}>
              <ScanBarcode aria-hidden="true" />
              {t("scanBarcode")}
            </button>
          )}
        </form>
        <video
          ref={videoRef}
          className={scanRunning ? styles.scannerVideo : styles.hidden}
          muted
          playsInline
        />
        <div className={styles.row}>
          <label className={styles.field}>
            {t("addToShelf")}
            <select
              className={styles.select}
              value={searchShelf}
              onChange={(event) => setSearchShelf(event.target.value as Shelf)}
            >
              {shelves.map((shelf) => (
                <option key={shelf} value={shelf}>{shelfNames[shelf]}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            {t("addToCollection")}
            <select
              className={styles.select}
              value={searchCollection}
              onChange={(event) => setSearchCollection(event.target.value)}
            >
              <option value="">{t("noCollection")}</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>{collection.name}</option>
              ))}
            </select>
          </label>
        </div>
        {!!results.length && (
          <div className={styles.results}>
            {results.map((book) => (
              <article className={styles.result} key={book.externalId}>
                {book.coverUrl ? (
                  <img className={styles.cover} src={book.coverUrl} alt="" />
                ) : (
                  <div className={styles.cover} aria-hidden="true" />
                )}
                <div>
                  <h3 className={styles.title}>{book.title}</h3>
                  <p className={styles.details}>
                    {book.authors.join(", ") || t("noAuthor")}
                    {book.pageCount ? ` · ${book.pageCount} ${t("pages")}` : ""}
                    {book.categories.length ? ` · ${book.categories.slice(0, 2).join(", ")}` : ""}
                  </p>
                  <button
                    className={styles.button}
                    type="button"
                    disabled={busy}
                    onClick={() => void addBook(book)}
                  >
                    <Plus aria-hidden="true" />
                    {t("addBook")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
        <details className={styles.manualDetails}>
          <summary>{t("manualAdd")}</summary>
          <form className={styles.manualForm} onSubmit={(event) => void createManualBook(event)}>
            <label className={styles.field}>{t("titleField")}<input className={styles.input} name="title" required maxLength={300} /></label>
            <label className={styles.field}>{t("author")}<input className={styles.input} name="author" /></label>
            <label className={styles.field}>{t("isbn")}<input className={styles.input} name="isbn" /></label>
            <label className={styles.field}>{t("pages")}<input className={styles.input} name="pageCount" type="number" min="0" step="1" /></label>
            <label className={styles.field}>{t("categories")}<input className={styles.input} name="categories" placeholder={t("categoryHint")} /></label>
            <label className={styles.field}>{t("coverUrl")}<input className={styles.input} name="coverUrl" type="url" /></label>
            <button className={styles.button} type="submit" disabled={busy}>{t("addBook")}</button>
          </form>
        </details>
      </section>

      <section className={`${styles.panel} ${styles.collectionsPanel}`} aria-labelledby="collections-heading">
        <h2 className={styles.sectionTitle} id="collections-heading"><FolderOpen aria-hidden="true" />{t("customCollections")}</h2>
        <form className={styles.row} onSubmit={(event) => void createCollection(event)}>
          <label className={styles.field}>
            {t("collectionName")}
            <input
              className={styles.input}
              value={collectionName}
              maxLength={50}
              onChange={(event) => setCollectionName(event.target.value)}
            />
          </label>
          <button className={`${styles.button} ${styles.secondaryButton}`} type="submit"><Plus aria-hidden="true" />{t("createCollection")}</button>
        </form>
        <div className={styles.collectionActions}>
          {collections.map((collection) => (
            <span className={styles.collectionItem} key={collection.id}>
              {collection.name}
              <button
                className={styles.smallButton}
                type="button"
                aria-label={t("deleteCollection", { name: collection.name })}
                onClick={() => void deleteCollection(collection)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </section>

      <section className={`${styles.panel} ${styles.libraryPanel}`} aria-labelledby="library-heading">
        <h2 className={styles.sectionTitle} id="library-heading"><Library aria-hidden="true" />{t("yourLibrary")}</h2>
        <div className={styles.shelves}>
          <button
            type="button"
            className={`${styles.shelfButton} ${shelfFilter === "all" ? styles.activeShelf : ""}`}
            aria-pressed={shelfFilter === "all"}
            onClick={() => setShelfFilter("all")}
          >
            {t("allBooks")} ({entries.length})
          </button>
          {shelves.map((shelf) => (
            <button
              type="button"
              className={`${styles.shelfButton} ${shelfFilter === shelf ? styles.activeShelf : ""}`}
              aria-pressed={shelfFilter === shelf}
              onClick={() => setShelfFilter(shelf)}
              key={shelf}
            >
              {shelfNames[shelf]} ({entries.filter((entry) => entry.status === shelf).length})
            </button>
          ))}
        </div>
        <div className={styles.toolbar}>
          <label className={styles.field}>
            {t("filterCollection")}
            <select className={styles.select} value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value)}>
              <option value="">{t("allCollections")}</option>
              {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            {t("sortBy")}
            <select className={styles.select} value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="title">{t("sortTitle")}</option>
              <option value="author">{t("sortAuthor")}</option>
              <option value="category">{t("sortCategory")}</option>
              <option value="rating">{t("sortRating")}</option>
              <option value="date-added">{t("sortDateAdded")}</option>
              <option value="date-finished">{t("sortDateFinished")}</option>
              <option value="page-count">{t("sortPageCount")}</option>
            </select>
          </label>
        </div>
        {error && <p className={`${styles.message} ${styles.error}`} role="alert">{error}</p>}
        {message && <p className={styles.message} role="status">{message}</p>}
        {entries.length ? (
          <div className={styles.entries}>
            {visibleEntries.map((entry) => (
              <BookEntry
                key={entry.id}
                entry={entry}
                collections={collections}
                shelfNames={shelfNames}
                labels={entryLabels}
                onChange={(id, changes) => setEntries((previous) =>
                  previous.map((item) => item.id === id ? { ...item, ...changes } : item)
                )}
                onSave={(changed) => void saveEntry(changed)}
                onRemove={(removed) => void removeEntry(removed)}
                busy={busyId === entry.id}
              />
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}><BookOpen aria-hidden="true" />{t("emptyLibrary")}</p>
        )}
        {!!entries.length && !visibleEntries.length && (
          <p className={styles.emptyState}><Search aria-hidden="true" />{t("noBooksMatch")}</p>
        )}
      </section>
      <p className={styles.message} role="status">{error || message}</p>
    </main>
  );
}
