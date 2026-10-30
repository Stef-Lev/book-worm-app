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
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import BookEntry from "@/components/book-entry/book-entry";
import Dropdown from "@/components/dropdown/dropdown";
import Button from "@/components/button/button";
import CollectionsDialog from "@/components/book-library/collections-dialog/collections-dialog";
import TextInput from "@/components/text-input/text-input";
import BookCover from "@/components/book-cover/book-cover";
import EmptyState from "@/components/book-library/empty-state/empty-state";
import LibraryFiltersDrawer from "@/components/book-library/library-filters-drawer/library-filters-drawer";
import LibraryFiltersSidebar from "@/components/book-library/library-filters-sidebar/library-filters-sidebar";
import SelectedFiltersPills from "@/components/book-library/selected-filters-pills/selected-filters-pills";
import type {
  LibraryFilterSection,
  LibraryFilterValues,
} from "@/components/book-library/library-filters-drawer/library-filters-drawer.types";
import type {
  BookCollection,
  BookEntryData,
} from "@/components/book-entry/book-entry.types";
import { toCollectionOptions } from "@/lib/collections";
import { fetchJson, getErrorMessage } from "@/lib/fetch-json";
import { BookSource } from "@/lib/book-source";
import {
  ALL_SHELVES,
  LibraryFilterKey,
  LibraryMode,
  LibrarySort,
  toLibrarySort,
} from "@/lib/library";
import type { FacetKey, ShelfFilter } from "@/lib/library";
import type { NewBook } from "@/lib/open-library";
import { SHELVES, Shelf, isShelf } from "@/lib/shelves";
import styles from "./book-library.module.css";
import type { BookLibraryProps } from "./book-library.types";

type LibraryResponse = {
  entries: BookEntryData[];
  collections: BookCollection[];
};
type SearchResponse = { results: NewBook[] };
type BarcodeResult = { rawValue: string };
type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeResult[]>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorInstance;

const filterDefaults: LibraryFilterValues = {
  [LibraryFilterKey.Shelf]: [],
  [LibraryFilterKey.Author]: [],
  [LibraryFilterKey.Category]: [],
  [LibraryFilterKey.Collection]: "",
  [LibraryFilterKey.SortBy]: LibrarySort.Title,
};

function fetchLibrary() {
  return fetchJson<LibraryResponse>("/api/library");
}

async function fetchSearchResults(searchTerm: string) {
  const params = new URLSearchParams({ q: searchTerm });
  const data = await fetchJson<SearchResponse>(`/api/books/search?${params}`);
  return data.results;
}

// Entries without a value (unrated, unfinished) always sort after those with one.
function compareMissingLast<T>(
  first: T | null | undefined,
  second: T | null | undefined,
  compare: (first: T, second: T) => number,
) {
  if (first == null || first === "")
    return second == null || second === "" ? 0 : 1;
  if (second == null || second === "") return -1;
  return compare(first, second);
}

function normalizeIsbn(value: string) {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

function parseMultiSelectFilter(value: string | string[]): string[] {
  if (Array.isArray(value)) return value;
  return value ? value.split(",").filter(Boolean) : [];
}

function serializeMultiSelectFilter(values: string[]): string {
  return values.join(",");
}

function filterMatchesValue(
  filterValue: string | string[],
  entryValue: string | string[],
): boolean {
  const filterValues = parseMultiSelectFilter(filterValue);
  if (filterValues.length === 0) return true;
  const entryValues = Array.isArray(entryValue) ? entryValue : [entryValue];
  return filterValues.some((fv) => entryValues.includes(fv));
}

type FilterState = {
  shelfFilter: ShelfFilter;
  authorFilter: string | string[];
  categoryFilter: string | string[];
  collectionFilter: string;
  sortBy: LibrarySort;
};

export default function BookLibrary({
  mode,
  initialQuery = "",
  initialFilters = {},
}: BookLibraryProps) {
  const t = useTranslations("libraryWorkspace");
  const isSearch = mode === LibraryMode.Search;
  const [entries, setEntries] = useState<BookEntryData[]>([]);
  const [collections, setCollections] = useState<BookCollection[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [libraryQuery, setLibraryQuery] = useState(initialFilters.q ?? "");
  const [results, setResults] = useState<NewBook[]>([]);
  const [filters, setFilters] = useState<FilterState>(() => ({
    shelfFilter: (() => {
      const status = initialFilters.status;
      if (!status) return [];
      if (typeof status === 'string' && status === ALL_SHELVES) return [];
      return status ? [status as Shelf] : [];
    })(),
    authorFilter: parseMultiSelectFilter(initialFilters.author ?? ""),
    categoryFilter: parseMultiSelectFilter(initialFilters.category ?? ""),
    collectionFilter: initialFilters.collection ?? "",
    sortBy: toLibrarySort(initialFilters.sort),
  }));
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [libraryLoadFailed, setLibraryLoadFailed] = useState(false);
  const [searchShelf, setSearchShelf] = useState(Shelf.ToRead);
  const [searchCollection, setSearchCollection] = useState("");
  const [busyId, setBusyId] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanRunning, setScanRunning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanCancelled = useRef(false);

  const showResults = useCallback(
    (found: NewBook[]) => {
      setResults(found);
      if (!found.length) toast.info(t("noSearchResults"));
    },
    [t],
  );

  const announceError = useCallback(
    (reason: unknown, fallback = t("genericError")) => {
      toast.error(getErrorMessage(reason, fallback));
    },
    [t],
  );

  async function searchCatalog(searchTerm: string) {
    setBusy(true);
    try {
      showResults(await fetchSearchResults(searchTerm));
    } catch (reason) {
      announceError(reason);
    } finally {
      setBusy(false);
    }
  }

  async function reloadEntries() {
    setEntries((await fetchLibrary()).entries);
  }

  useEffect(() => {
    let active = true;
    fetchLibrary()
      .then((data) => {
        if (!active) return;
        setEntries(data.entries);
        setCollections(data.collections);
        setLibraryLoaded(true);
        setLibraryLoadFailed(false);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setLibraryLoadFailed(true);
        announceError(reason, t("loadError"));
      });
    return () => {
      active = false;
      scanCancelled.current = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [announceError, t]);

  useEffect(() => {
    if (!isSearch || initialQuery.trim().length < 2) return;
    let active = true;
    fetchSearchResults(initialQuery)
      .then((found) => active && showResults(found))
      .catch((reason: unknown) => active && announceError(reason));
    return () => {
      active = false;
    };
  }, [announceError, initialQuery, isSearch, showResults]);

  const shelfNames: Record<Shelf, string> = {
    [Shelf.ToRead]: t("shelfToRead"),
    [Shelf.CurrentlyReading]: t("shelfCurrentlyReading"),
    [Shelf.Read]: t("shelfRead"),
    [Shelf.DidNotFinish]: t("shelfDidNotFinish"),
  };

  useEffect(() => {
    if (isSearch) return;
    
    // Set up debounced URL update (300ms delay)
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      const shelfValue = Array.isArray(filters.shelfFilter)
        ? serializeMultiSelectFilter(filters.shelfFilter)
        : filters.shelfFilter;
      const authorValue = Array.isArray(filters.authorFilter)
        ? serializeMultiSelectFilter(filters.authorFilter as string[])
        : filters.authorFilter;
      const categoryValue = Array.isArray(filters.categoryFilter)
        ? serializeMultiSelectFilter(filters.categoryFilter as string[])
        : filters.categoryFilter;
      const values: [string, string, string][] = [
        ["q", libraryQuery.trim(), ""],
        ["status", shelfValue, ""],
        ["author", authorValue, ""],
        ["category", categoryValue, ""],
        ["collection", filters.collectionFilter, ""],
        ["sort", filters.sortBy, LibrarySort.Title],
      ];
      for (const [key, value, fallback] of values) {
        if (value !== fallback) params.set(key, value);
      }
      const search = params.toString();
      const current = new URLSearchParams(window.location.search);
      if (search === current.toString()) return;
      const url = `${window.location.pathname}${search ? `?${search}` : ""}`;
      // Filter/sort changes get their own history entry; typing in search does not.
      params.delete("q");
      current.delete("q");
      if (params.toString() === current.toString()) {
        window.history.replaceState(null, "", url);
      } else {
        window.history.pushState(null, "", url);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    filters,
    isSearch,
    libraryQuery,
  ]);

  useEffect(() => {
    if (isSearch) return;
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      setFilters({
        shelfFilter: parseMultiSelectFilter(params.get("status") ?? ""),
        authorFilter: parseMultiSelectFilter(params.get("author") ?? ""),
        categoryFilter: parseMultiSelectFilter(params.get("category") ?? ""),
        collectionFilter: params.get("collection") ?? "",
        sortBy: toLibrarySort(params.get("sort")),
      });
    }
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [isSearch]);

  const searchTerm = useMemo(
    () => libraryQuery.trim().toLocaleLowerCase(),
    [libraryQuery],
  );
  
  const isbnSearchTerm = useMemo(
    () => normalizeIsbn(libraryQuery),
    [libraryQuery],
  );

  const matchesFilters = useCallback(
    (entry: BookEntryData, ignore?: FacetKey) => {
      const matchesQuery =
        !searchTerm ||
        [
          entry.book.title,
          ...entry.book.authors,
          ...entry.book.categories,
          entry.book.isbn ?? "",
        ].some((value) => value.toLocaleLowerCase().includes(searchTerm)) ||
        (!!isbnSearchTerm &&
          normalizeIsbn(entry.book.isbn ?? "").includes(isbnSearchTerm));
      return (
        matchesQuery &&
        (ignore === LibraryFilterKey.Shelf ||
          !filters.shelfFilter ||
          Array.isArray(filters.shelfFilter) && filters.shelfFilter.length === 0 ||
          filterMatchesValue(filters.shelfFilter, entry.status)) &&
        (ignore === LibraryFilterKey.Collection ||
          !filters.collectionFilter ||
          entry.collectionIds.includes(filters.collectionFilter)) &&
        (ignore === LibraryFilterKey.Author ||
          !filters.authorFilter ||
          Array.isArray(filters.authorFilter) && filters.authorFilter.length === 0 ||
          filterMatchesValue(filters.authorFilter, entry.book.authors)) &&
        (ignore === LibraryFilterKey.Category ||
          !filters.categoryFilter ||
          Array.isArray(filters.categoryFilter) && filters.categoryFilter.length === 0 ||
          filterMatchesValue(filters.categoryFilter, entry.book.categories))
      );
    },
    [filters, searchTerm, isbnSearchTerm],
  );

  const visibleEntries = useMemo(() => {
    const filtered = entries.filter((entry) => matchesFilters(entry));
    return filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case LibrarySort.Author:
          return (a.book.authors[0] ?? "").localeCompare(
            b.book.authors[0] ?? "",
          );
        case LibrarySort.Rating:
          return compareMissingLast(a.rating, b.rating, (x, y) => y - x);
        case LibrarySort.PageCount:
          return b.book.pageCount - a.book.pageCount;
        case LibrarySort.DateAdded:
          return b.createdAt.localeCompare(a.createdAt);
        default:
          return a.book.title.localeCompare(b.book.title);
      }
    });
  }, [entries, matchesFilters, filters.sortBy]);

  // Each facet lists only values present in books matching the *other* filters.
  const facetEntries = (facet: FacetKey) =>
    entries.filter((entry) => matchesFilters(entry, facet));
  const uniqueSorted = (values: string[], selected: string | string[]) => {
    const selectedArray = Array.isArray(selected) ? selected : (selected ? [selected] : []);
    return [...new Set([...values, ...selectedArray])].sort(
      (first, second) => first.localeCompare(second),
    );
  };

  const shelfEntries = useMemo(
    () => facetEntries(LibraryFilterKey.Shelf),
    [entries, matchesFilters],
  );
  const authorEntries = useMemo(
    () => facetEntries(LibraryFilterKey.Author),
    [entries, matchesFilters],
  );
  const categoryEntries = useMemo(
    () => facetEntries(LibraryFilterKey.Category),
    [entries, matchesFilters],
  );
  const collectionEntries = useMemo(
    () => facetEntries(LibraryFilterKey.Collection),
    [entries, matchesFilters],
  );

  const authors = useMemo(
    () => uniqueSorted(
      authorEntries.flatMap((entry) => entry.book.authors),
      filters.authorFilter,
    ),
    [authorEntries, filters.authorFilter],
  );
  const categories = useMemo(
    () => uniqueSorted(
      categoryEntries.flatMap((entry) => entry.book.categories),
      filters.categoryFilter,
    ),
    [categoryEntries, filters.categoryFilter],
  );
  const collectionIdsInUse = useMemo(
    () => new Set(
      collectionEntries.flatMap((entry) => entry.collectionIds),
    ),
    [collectionEntries],
  );

  // Optimized facet counts using frequency maps instead of repeated filtering
  const facetCounts = useMemo(() => {
    const shelves = new Map<Shelf, number>();
    const authorCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const collectionCounts = new Map<string, number>();

    shelfEntries.forEach((entry) => {
      shelves.set(entry.status, (shelves.get(entry.status) ?? 0) + 1);
    });

    authorEntries.forEach((entry) => {
      entry.book.authors.forEach((author) => {
        authorCounts.set(author, (authorCounts.get(author) ?? 0) + 1);
      });
    });

    categoryEntries.forEach((entry) => {
      entry.book.categories.forEach((category) => {
        categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      });
    });

    collectionEntries.forEach((entry) => {
      entry.collectionIds.forEach((collectionId) => {
        collectionCounts.set(collectionId, (collectionCounts.get(collectionId) ?? 0) + 1);
      });
    });

    return { shelves, authorCounts, categoryCounts, collectionCounts };
  }, [shelfEntries, authorEntries, categoryEntries, collectionEntries]);

  const statusOptions = useMemo(
    () => SHELVES.map((shelf) => ({
      value: shelf,
      label: shelfNames[shelf],
      count: facetCounts.shelves.get(shelf) ?? 0,
    })),
    [facetCounts, shelfNames],
  );

  const authorOptions = useMemo(
    () => authors.map((author) => ({
      value: author,
      label: author,
      count: facetCounts.authorCounts.get(author) ?? 0,
    })),
    [authors, facetCounts],
  );

  const categoryOptions = useMemo(
    () => categories.map((category) => ({
      value: category,
      label: category,
      count: facetCounts.categoryCounts.get(category) ?? 0,
    })),
    [categories, facetCounts],
  );

  const collectionOptions = useMemo(
    () => collections
      .filter(
        (collection) =>
          collectionIdsInUse.has(collection.id) ||
          collection.id === filters.collectionFilter,
      )
      .map((collection) => ({
        value: collection.id,
        label: collection.name,
        count: facetCounts.collectionCounts.get(collection.id) ?? 0,
      })),
    [collections, collectionIdsInUse, facetCounts, filters.collectionFilter],
  );

  const sortOptions = useMemo(
    () => [
      { value: LibrarySort.Title, label: t("sortTitle") },
      { value: LibrarySort.Author, label: t("sortAuthor") },
      { value: LibrarySort.Rating, label: t("sortRating") },
      { value: LibrarySort.PageCount, label: t("sortPageCount") },
      { value: LibrarySort.DateAdded, label: t("sortDateAdded") },
    ],
    [t],
  );

  const filterValues: LibraryFilterValues = useMemo(
    () => ({
      [LibraryFilterKey.Shelf]: filters.shelfFilter,
      [LibraryFilterKey.Author]: filters.authorFilter,
      [LibraryFilterKey.Category]: filters.categoryFilter,
      [LibraryFilterKey.Collection]: filters.collectionFilter,
      [LibraryFilterKey.SortBy]: filters.sortBy,
    }),
    [filters],
  );

  const filterSections: LibraryFilterSection[] = useMemo(
    () => [
      { key: LibraryFilterKey.SortBy, label: t("sortBy"), options: sortOptions },
      {
        key: LibraryFilterKey.Shelf,
        label: t("status"),
        options: statusOptions,
        multiSelect: true,
      },
      {
        key: LibraryFilterKey.Author,
        label: t("author"),
        options: authorOptions,
        multiSelect: true,
      },
      {
        key: LibraryFilterKey.Category,
        label: t("categories"),
        options: categoryOptions,
        multiSelect: true,
      },
      {
        key: LibraryFilterKey.Collection,
        label: t("collection"),
        options: collectionOptions,
        multiSelect: true,
      },
    ],
    [t, sortOptions, statusOptions, authorOptions, categoryOptions, collectionOptions],
  );

  function applyFilters(values: LibraryFilterValues) {
    const shelfValue = values[LibraryFilterKey.Shelf];
    const authorValue = values[LibraryFilterKey.Author];
    const categoryValue = values[LibraryFilterKey.Category];
    const collectionValue = values[LibraryFilterKey.Collection];
    const sortValue = values[LibraryFilterKey.SortBy];

    setFilters({
      shelfFilter: Array.isArray(shelfValue) ? shelfValue : parseMultiSelectFilter(String(shelfValue)),
      authorFilter: Array.isArray(authorValue) ? authorValue : parseMultiSelectFilter(String(authorValue)),
      categoryFilter: Array.isArray(categoryValue) ? categoryValue : parseMultiSelectFilter(String(categoryValue)),
      collectionFilter: Array.isArray(collectionValue) ? serializeMultiSelectFilter(collectionValue) : String(collectionValue),
      sortBy: toLibrarySort(String(sortValue)),
    });
  }

  function getFilteredResultCount(filterValues: LibraryFilterValues): number {
    const shelfFilterValue = Array.isArray(filterValues[LibraryFilterKey.Shelf])
      ? filterValues[LibraryFilterKey.Shelf]
      : parseMultiSelectFilter(String(filterValues[LibraryFilterKey.Shelf]));
    const authorFilterValue = Array.isArray(filterValues[LibraryFilterKey.Author])
      ? filterValues[LibraryFilterKey.Author]
      : parseMultiSelectFilter(String(filterValues[LibraryFilterKey.Author]));
    const categoryFilterValue = Array.isArray(filterValues[LibraryFilterKey.Category])
      ? filterValues[LibraryFilterKey.Category]
      : parseMultiSelectFilter(String(filterValues[LibraryFilterKey.Category]));
    const collectionFilterValue = String(filterValues[LibraryFilterKey.Collection]);

    return entries.filter((entry) => {
      const matchesQuery =
        !searchTerm ||
        [
          entry.book.title,
          ...entry.book.authors,
          ...entry.book.categories,
          entry.book.isbn ?? "",
        ].some((value) => value.toLocaleLowerCase().includes(searchTerm)) ||
        (!!isbnSearchTerm &&
          normalizeIsbn(entry.book.isbn ?? "").includes(isbnSearchTerm));

      return (
        matchesQuery &&
        (!shelfFilterValue ||
          shelfFilterValue.length === 0 ||
          filterMatchesValue(shelfFilterValue, entry.status)) &&
        (!collectionFilterValue ||
          entry.collectionIds.includes(collectionFilterValue)) &&
        (!authorFilterValue ||
          authorFilterValue.length === 0 ||
          filterMatchesValue(authorFilterValue, entry.book.authors)) &&
        (!categoryFilterValue ||
          categoryFilterValue.length === 0 ||
          filterMatchesValue(categoryFilterValue, entry.book.categories))
      );
    }).length;
  }

  function removeFilter(key: LibraryFilterKey) {
    applyFilters({ ...filterValues, [key]: filterDefaults[key] });
  }

  function removeFilterValue(key: LibraryFilterKey, value: string) {
    const currentValue = filterValues[key];
    const values = parseMultiSelectFilter(currentValue as string | string[]);
    const newValues = values.filter((v) => v !== value);
    applyFilters({
      ...filterValues,
      [key]: serializeMultiSelectFilter(newValues),
    });
  }

  function isInLibrary(book: NewBook) {
    return entries.some(
      (entry) =>
        (book.externalId &&
          entry.book.source === book.source &&
          entry.book.externalId === book.externalId) ||
        (book.isbn &&
          normalizeIsbn(book.isbn) === normalizeIsbn(entry.book.isbn ?? "")),
    );
  }

  async function addBook(book: NewBook): Promise<boolean> {
    if (isInLibrary(book)) {
      toast.info(t("inLibrary"));
      return false;
    }
    setBusy(true);
    try {
      await fetchJson("/api/library", {
        method: "POST",
        json: {
          book,
          status: searchShelf,
          collectionIds: searchCollection ? [searchCollection] : [],
        },
      });
      await reloadEntries();
      toast.success(t("bookAdded"));
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
    const book: NewBook = {
      source: BookSource.Manual,
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
    try {
      await fetchJson(`/api/library/${entry.id}`, {
        method: "PATCH",
        json: {
          status: entry.status,
          rating: entry.rating,
          review: entry.review,
          startedAt: entry.startedAt,
          finishedAt: entry.finishedAt,
          collectionIds: entry.collectionIds,
        },
      });
      await reloadEntries();
      toast.success(t("changesSaved"));
    } catch (reason) {
      announceError(reason);
    } finally {
      setBusyId("");
    }
  }

  async function removeEntry(entry: BookEntryData) {
    setBusyId(entry.id);
    try {
      await fetchJson(`/api/library/${entry.id}`, { method: "DELETE" });
      setEntries((previous) => previous.filter((item) => item.id !== entry.id));
      toast.success(t("bookRemoved"));
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
    const detectorClass = (
      window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;
    if (!detectorClass || !navigator.mediaDevices?.getUserMedia) {
      toast.error(t("scannerUnsupported"));
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

  const handleEntryChange = useCallback(
    (id: string, changes: Partial<BookEntryData>) => {
      setEntries((previous) =>
        previous.map((item) =>
          item.id === id ? { ...item, ...changes } : item,
        ),
      );
    },
    [],
  );

  const handleEntrySave = useCallback(
    (entry: BookEntryData) => {
      void saveEntry(entry);
    },
    [],
  );

  const handleEntryRemove = useCallback(
    (entry: BookEntryData) => {
      void removeEntry(entry);
    },
    [],
  );

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
    editBookDetails: t("editBookDetails"),
    title: t("title"),
    authors: t("authors"),
    isbn: t("isbn"),
    pageCount: t("pageCount"),
    coverUrl: t("coverUrl"),
    addAuthor: t("addAuthor"),
    close: t("close"),
  };

  return (
    <main className={styles.main}>
      {!libraryLoaded && !libraryLoadFailed && <RouteLoading />}
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
              onChange={(event) => {
                const newValue = event.target.value;
                setQuery(newValue);
                // Clear results if the search box is emptied
                if (newValue.trim().length === 0) {
                  setResults([]);
                }
              }}
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
              onValueChange={(value) => {
                if (isShelf(value)) setSearchShelf(value);
              }}
              options={SHELVES.map((shelf) => ({
                value: shelf,
                label: shelfNames[shelf],
              }))}
            />
            <Dropdown
              label={t("addToCollection")}
              fieldClassName={styles.field}
              value={searchCollection}
              onValueChange={setSearchCollection}
              options={toCollectionOptions(collections, t("noCollection"))}
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
                  if (filters.collectionFilter === id) {
                    setFilters({ ...filters, collectionFilter: "" });
                  }
                  if (searchCollection === id) setSearchCollection("");
                }}
              />
            </div>
            <div className={styles.libraryLayout}>
              <LibraryFiltersSidebar
                values={filterValues}
                defaults={filterDefaults}
                sections={filterSections}
                onChange={(key, value) =>
                  applyFilters({ ...filterValues, [key]: value })
                }
                onClear={() => applyFilters(filterDefaults)}
              />
              <div className={styles.libraryContent}>
                <TextInput
                  label={t("searchLibrary")}
                  fieldClassName={styles.field}
                  type="search"
                  value={libraryQuery}
                  placeholder={t("librarySearchPlaceholder")}
                  onChange={(event) => setLibraryQuery(event.target.value)}
                />
                <LibraryFiltersDrawer
                  disabled={!libraryLoaded}
                  values={filterValues}
                  defaults={filterDefaults}
                  sections={filterSections}
                  onApply={applyFilters}
                  resultCount={visibleEntries.length}
                  getResultCount={getFilteredResultCount}
                />
                <SelectedFiltersPills
                  values={filterValues}
                  defaults={filterDefaults}
                  sections={filterSections}
                  onRemoveFilter={removeFilter}
                  onRemoveFilterValue={removeFilterValue}
                  onClearAll={() => applyFilters(filterDefaults)}
                />
                {!libraryLoaded ? (
                  !libraryLoadFailed && (
                    <p role="status">{t("loadingLibrary")}</p>
                  )
                ) : entries.length ? (
                  <div className={styles.entries}>
                    {visibleEntries.map((entry) => (
                      <BookEntry
                        key={entry.id}
                        entry={entry}
                        collections={collections}
                        shelfNames={shelfNames}
                        labels={entryLabels}
                        onChange={handleEntryChange}
                        onSave={handleEntrySave}
                        onRemove={handleEntryRemove}
                        busy={busyId === entry.id}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={<BookOpen aria-hidden="true" />}>
                    {t("emptyLibrary")}
                    <br />
                    <Link href="/search">
                      <strong>{t("addBooks")}</strong>
                    </Link>
                  </EmptyState>
                )}
                {!!entries.length && !visibleEntries.length && (
                  <EmptyState icon={<Search aria-hidden="true" />}>
                    {t("noBooksMatch")}
                  </EmptyState>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
