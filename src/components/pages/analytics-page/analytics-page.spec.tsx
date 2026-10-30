import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { screen, within } from "@testing-library/react";
import mongoose from "mongoose";
import { Shelf } from "@/lib/shelves";
import { RedirectError } from "@/test/navigation";
import { renderWithIntl, t } from "@/test/utils";
import AnalyticsPage from "./analytics-page";

type Fixture = {
  status: Shelf;
  title?: string;
  authors?: string[];
  pageCount?: number;
  rating?: number;
  startedAt?: Date;
  finishedAt?: Date;
  collections?: string[];
};

const userId = new mongoose.Types.ObjectId().toString();
const classicsId = new mongoose.Types.ObjectId();
const sciFiId = new mongoose.Types.ObjectId();

const db = vi.hoisted(() => ({
  session: null as { user?: { id?: string } } | null,
  userBooks: [] as unknown[],
  collections: [] as unknown[],
}));

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/auth", () => ({ auth: async () => db.session }));
vi.mock("@/lib/mongodb", () => ({ connectDB: async () => null }));
vi.mock("@/models/Book", () => ({ default: {} }));
vi.mock("@/models/UserBook", () => ({
  default: {
    find: () => ({
      populate: () => ({
        sort: () => ({ lean: async () => db.userBooks }),
      }),
    }),
  },
}));
vi.mock("@/models/Collection", () => ({
  default: {
    find: () => ({ sort: () => ({ lean: async () => db.collections }) }),
  },
}));

function userBook({ title = "Untitled", collections = [], ...entry }: Fixture) {
  return {
    _id: new mongoose.Types.ObjectId(),
    status: entry.status,
    rating: entry.rating,
    startedAt: entry.startedAt,
    finishedAt: entry.finishedAt,
    collectionIds: collections.map((id) => new mongoose.Types.ObjectId(id)),
    bookId: {
      title,
      authors: entry.authors ?? ["Ursula K. Le Guin"],
      pageCount: entry.pageCount ?? 0,
    },
  };
}

const library = [
  userBook({
    status: Shelf.Read,
    title: "The Dispossessed",
    pageCount: 387,
    rating: 5,
    startedAt: new Date("2026-01-02T00:00:00Z"),
    finishedAt: new Date("2026-01-20T00:00:00Z"),
    collections: [classicsId.toString()],
  }),
  userBook({
    status: Shelf.Read,
    title: "Kindred",
    authors: ["Octavia E. Butler"],
    pageCount: 264,
    rating: 4.5,
    finishedAt: new Date("2026-03-05T00:00:00Z"),
    collections: [sciFiId.toString()],
  }),
  userBook({
    status: Shelf.Read,
    title: "Mystery Notes",
    authors: [],
    rating: 4.5,
    finishedAt: new Date("2026-03-15T00:00:00Z"),
  }),
  userBook({
    status: Shelf.Read,
    title: "Dune",
    pageCount: 412,
    finishedAt: new Date("2025-06-10T00:00:00Z"),
    collections: [sciFiId.toString()],
  }),
  // Read but without a finish date: excluded from time-based stats.
  userBook({ status: Shelf.Read, title: "No Date", pageCount: 100 }),
  // Started after finishing: inconsistent dates.
  userBook({
    status: Shelf.Read,
    title: "Time Travel",
    pageCount: 200,
    startedAt: new Date("2026-02-10T00:00:00Z"),
    finishedAt: new Date("2026-02-01T00:00:00Z"),
  }),
  userBook({
    status: Shelf.CurrentlyReading,
    title: "Piranesi",
    rating: 3,
    collections: [classicsId.toString()],
  }),
  userBook({ status: Shelf.CurrentlyReading, title: "Circe" }),
  userBook({ status: Shelf.ToRead, title: "Middlemarch" }),
  userBook({ status: Shelf.DidNotFinish, title: "Ulysses", rating: 1 }),
];

const collections = [
  { _id: classicsId, name: "Classics" },
  { _id: sciFiId, name: "Sci-Fi" },
];

// React DOM can't render nested async server components (e.g. ReadingOverTime),
// so await them up front the way the RSC renderer would.
async function resolveServerComponents(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map(resolveServerComponents));
  if (!isValidElement(node)) return node;
  const { type } = node;
  const props = node.props as { children?: ReactNode };
  if (typeof type === "function" && type.constructor.name === "AsyncFunction") {
    return resolveServerComponents(
      await (type as (p: unknown) => Promise<ReactNode>)(props),
    );
  }
  if (props.children === undefined) return node;
  const children = await resolveServerComponents(props.children);
  return Array.isArray(children)
    ? cloneElement(node, undefined, ...children)
    : cloneElement(node, undefined, children);
}

async function renderPage(year?: string) {
  const page = await AnalyticsPage({ searchParams: Promise.resolve({ year }) });
  renderWithIntl((await resolveServerComponents(page)) as ReactElement);
}

function getMetric(label: string) {
  return within(
    screen.getByRole("region", { name: t("pages.analytics.summary") }),
  )
    .getByText(label)
    .closest("article")!;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-04-15T12:00:00Z"));
  db.session = { user: { id: userId } };
  db.userBooks = library;
  db.collections = collections;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AnalyticsPage", () => {
  it("should redirect to the login page when there is no session", async () => {
    db.session = null;

    await expect(
      AnalyticsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow(new RedirectError("/login"));
  });

  it("should redirect to the login page when the user id is invalid", async () => {
    db.session = { user: { id: "not-an-object-id" } };

    await expect(
      AnalyticsPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toBeInstanceOf(RedirectError);
  });

  it("should render the page title and description", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      t("pages.analytics.title"),
    );
    expect(screen.getByRole("main")).toHaveTextContent(
      t("pages.analytics.description"),
    );
  });

  it("should default to the current year and summarise its completions", async () => {
    await renderPage();

    expect(
      screen.getByRole("combobox", { name: t("pages.analytics.showStatsFor") }),
    ).toHaveTextContent("2026");

    const finished = getMetric(t("pages.analytics.booksFinished"));
    expect(finished).toHaveTextContent("3");
    expect(finished).toHaveTextContent("2026");

    const pages = getMetric(t("pages.analytics.pagesInFinishedBooks"));
    expect(pages).toHaveTextContent("651");
    expect(pages).toHaveTextContent(
      t("pages.analytics.knownPageCounts", { count: 1 }),
    );

    const reading = getMetric(t("pages.analytics.currentlyReading"));
    expect(reading).toHaveTextContent("2");
    expect(
      within(reading).getByRole("link", {
        name: t("pages.analytics.viewLibrary"),
      }),
    ).toHaveAttribute("href", "/library");
  });

  it("should show monthly completions up to the current month for the selected year", async () => {
    await renderPage("2026");

    const chart = screen.getByRole("region", {
      name: t("pages.analytics.readingOverTime"),
    });
    expect(chart).toHaveTextContent(
      t("pages.analytics.monthlyCompletions", { period: "2026" }),
    );
    expect(within(chart).getAllByRole("progressbar")).toHaveLength(4);
    expect(
      within(chart).getByRole("progressbar", {
        name: t("pages.analytics.periodCompletionCount", {
          period: "Mar 2026",
          count: 2,
        }),
      }),
    ).toHaveAttribute("value", "2");
    expect(
      within(chart).getByRole("progressbar", {
        name: t("pages.analytics.periodCompletionCount", {
          period: "Feb 2026",
          count: 0,
        }),
      }),
    ).toHaveAttribute("value", "0");
    expect(chart).toHaveTextContent(
      t("pages.analytics.invalidCompletionDates", { count: 2 }),
    );
  });

  it("should summarise a past year when it is selected", async () => {
    await renderPage("2025");

    const finished = getMetric(t("pages.analytics.booksFinished"));
    expect(finished).toHaveTextContent("1");
    expect(finished).toHaveTextContent("2025");
    expect(getMetric(t("pages.analytics.pagesInFinishedBooks"))).toHaveTextContent(
      "412",
    );

    const chart = screen.getByRole("region", {
      name: t("pages.analytics.readingOverTime"),
    });
    expect(within(chart).getAllByRole("progressbar")).toHaveLength(12);
    expect(
      within(chart).getByRole("progressbar", {
        name: t("pages.analytics.periodCompletionCount", {
          period: "Jun 2025",
          count: 1,
        }),
      }),
    ).toBeInTheDocument();
  });

  it("should summarise all completions per year when all time is selected", async () => {
    await renderPage("all");

    expect(
      screen.getByRole("combobox", { name: t("pages.analytics.showStatsFor") }),
    ).toHaveTextContent(t("pages.analytics.allTime"));

    const finished = getMetric(t("pages.analytics.booksFinished"));
    expect(finished).toHaveTextContent("4");
    expect(finished).toHaveTextContent(t("pages.analytics.allTime"));
    expect(getMetric(t("pages.analytics.pagesInFinishedBooks"))).toHaveTextContent(
      "1,063",
    );

    const chart = screen.getByRole("region", {
      name: t("pages.analytics.readingOverTime"),
    });
    expect(chart).toHaveTextContent(t("pages.analytics.yearlyCompletions"));
    expect(
      within(chart).getByRole("progressbar", {
        name: t("pages.analytics.periodCompletionCount", {
          period: "2025",
          count: 1,
        }),
      }),
    ).toBeInTheDocument();
    expect(
      within(chart).getByRole("progressbar", {
        name: t("pages.analytics.periodCompletionCount", {
          period: "2026",
          count: 3,
        }),
      }),
    ).toBeInTheDocument();
  });

  it.each(["1999", "2030", "abc"])(
    "should fall back to the current year for the invalid year %s",
    async (year) => {
      await renderPage(year);

      expect(
        screen.getByRole("combobox", {
          name: t("pages.analytics.showStatsFor"),
        }),
      ).toHaveTextContent("2026");
      expect(getMetric(t("pages.analytics.booksFinished"))).toHaveTextContent(
        "3",
      );
    },
  );

  it("should show the shelf snapshot of the whole library", async () => {
    await renderPage("2025");

    const overview = screen.getByRole("region", {
      name: t("pages.analytics.libraryOverview"),
    });
    expect(overview).toHaveTextContent(
      t("pages.analytics.libraryReadPercentage"),
    );
    expect(overview).toHaveTextContent("60%");
    expect(
      within(overview).getByRole("progressbar", {
        name: t("pages.analytics.readBooksOutOfTotal", { read: 6, total: 10 }),
      }),
    ).toHaveAttribute("value", "6");

    const shelves = within(overview).getAllByRole("listitem");
    expect(shelves[0]).toHaveTextContent(
      `${t("pages.analytics.shelves.to-read")}1`,
    );
    expect(shelves[1]).toHaveTextContent(
      `${t("pages.analytics.shelves.currently-reading")}2`,
    );
    expect(shelves[2]).toHaveTextContent(`${t("pages.analytics.shelves.read")}6`);
    expect(shelves[3]).toHaveTextContent(
      `${t("pages.analytics.shelves.did-not-finish")}1`,
    );
  });

  it("should show the top five favorites ordered by rating then title", async () => {
    await renderPage();

    const favorites = screen.getByRole("region", {
      name: t("pages.analytics.yourFavorites"),
    });
    const titles = within(favorites).getAllByRole("heading", { level: 3 });
    expect(titles).toHaveLength(5);
    expect(titles[0]).toHaveTextContent("The Dispossessed");
    expect(titles[1]).toHaveTextContent("Kindred");
    expect(titles[2]).toHaveTextContent("Mystery Notes");
    expect(titles[3]).toHaveTextContent("Piranesi");
    expect(titles[4]).toHaveTextContent("Ulysses");

    const [, kindred, mystery] = within(favorites).getAllByRole("listitem");
    expect(kindred).toHaveTextContent("Octavia E. Butler");
    expect(kindred).toHaveTextContent(
      t("pages.analytics.ratingOutOfFive", { rating: 4.5 }),
    );
    expect(mystery).toHaveTextContent(t("pages.analytics.unknownAuthor"));
  });

  it("should show the read percentage per collection", async () => {
    await renderPage();

    const metric = screen
      .getByText(t("pages.analytics.libraryReadPercentageAllTime"), {
        selector: "article p",
      })
      .closest("article")!;
    expect(metric).toHaveTextContent("75%");
    expect(metric).toHaveTextContent("3 of 4 books");
  });

  it("should show empty states when the library is empty", async () => {
    db.userBooks = [];
    db.collections = [];

    await renderPage();

    expect(getMetric(t("pages.analytics.booksFinished"))).toHaveTextContent(
      "0",
    );
    expect(
      screen.getByRole("region", { name: t("pages.analytics.readingOverTime") }),
    ).toHaveTextContent(t("pages.analytics.noCompletions"));

    const overview = screen.getByRole("region", {
      name: t("pages.analytics.libraryOverview"),
    });
    expect(overview).toHaveTextContent(t("pages.analytics.emptyLibrary"));
    expect(
      within(overview).getByRole("link", {
        name: t("pages.analytics.findBooks"),
      }),
    ).toHaveAttribute("href", "/search");

    expect(
      screen.getByRole("region", { name: t("pages.analytics.yourFavorites") }),
    ).toHaveTextContent(t("pages.analytics.noRatedBooks"));
  });
});
