import { useState } from "react";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { renderWithIntl, t } from "@/test/utils";
import type { BookCollection } from "@/components/book-entry/book-entry.types";
import CollectionsDialog from "./collections-dialog";

const DUPLICATE_ERROR = "You already have a collection with that name.";
const NOT_FOUND_ERROR = "Collection not found.";

type FakeServer = {
  collections: Map<string, BookCollection>;
  failNext?: { status: number; body: unknown };
  hold?: Promise<void>;
};

let server: FakeServer;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function hasName(name: string, exceptId?: string) {
  return [...server.collections.values()].some(
    (collection) => collection.name === name && collection.id !== exceptId,
  );
}

async function fakeFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  if (server.hold) await server.hold;
  if (server.failNext) {
    const { status, body } = server.failNext;
    server.failNext = undefined;
    return json(body, status);
  }
  const url = String(input);
  const method = init.method ?? "GET";
  const body = init.body ? JSON.parse(String(init.body)) : {};
  const id = url.match(/^\/api\/collections\/(.+)$/)?.[1];

  if (url === "/api/collections" && method === "POST") {
    if (hasName(body.name)) return json({ error: DUPLICATE_ERROR }, 409);
    const collection = {
      id: `c${server.collections.size + 1}`,
      name: body.name,
    };
    server.collections.set(collection.id, collection);
    return json({ collection }, 201);
  }
  if (id && method === "PATCH") {
    if (!server.collections.has(id)) {
      return json({ error: NOT_FOUND_ERROR }, 404);
    }
    if (hasName(body.name, id)) return json({ error: DUPLICATE_ERROR }, 409);
    const collection = { id, name: body.name };
    server.collections.set(id, collection);
    return json({ collection });
  }
  if (id && method === "DELETE") {
    if (!server.collections.delete(id)) {
      return json({ error: NOT_FOUND_ERROR }, 404);
    }
    return json({ success: true });
  }
  return json({ error: "Not found" }, 404);
}

const initialCollections: BookCollection[] = [
  { id: "c1", name: "Favourites" },
  { id: "c2", name: "Sci-fi" },
];

function Harness({
  initial = initialCollections,
  disabled,
}: {
  initial?: BookCollection[];
  disabled?: boolean;
}) {
  const [collections, setCollections] = useState(initial);
  const [assigned, setAssigned] = useState(initial.map(({ id }) => id));
  return (
    <ToastProvider>
      <CollectionsDialog
        collections={collections}
        onChange={setCollections}
        onDeleted={(id) =>
          setAssigned((current) => current.filter((item) => item !== id))
        }
        disabled={disabled}
      />
      <ul aria-label="assigned collections">
        {assigned.map((id) => (
          <li key={id}>{id}</li>
        ))}
      </ul>
    </ToastProvider>
  );
}

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: t("libraryWorkspace.manageCollections") }),
  );
  return screen.findByRole("dialog", {
    name: t("libraryWorkspace.manageCollections"),
  });
}

function collectionNames(dialog: HTMLElement) {
  return within(dialog)
    .queryAllByRole("listitem")
    .map((item) => (within(item).getByRole("textbox") as HTMLInputElement).value);
}

describe("CollectionsDialog", () => {
  beforeEach(() => {
    server = {
      collections: new Map(initialCollections.map((item) => [item.id, item])),
    };
    vi.stubGlobal("fetch", fakeFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should render the trigger without opening the dialog", () => {
    renderWithIntl(<Harness />);

    expect(
      screen.getByRole("button", {
        name: t("libraryWorkspace.manageCollections"),
      }),
    ).toBeEnabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should disable the trigger when disabled", () => {
    renderWithIntl(<Harness disabled />);

    expect(
      screen.getByRole("button", {
        name: t("libraryWorkspace.manageCollections"),
      }),
    ).toBeDisabled();
  });

  it("should list the existing collections when opened", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);

    const dialog = await openDialog(user);

    expect(collectionNames(dialog)).toEqual(["Favourites", "Sci-fi"]);
    expect(
      within(dialog).getByRole("textbox", {
        name: t("libraryWorkspace.renameCollection", { name: "Favourites" }),
      }),
    ).toHaveValue("Favourites");
    expect(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.deleteCollection", { name: "Sci-fi" }),
      }),
    ).toBeInTheDocument();
  });

  it("should show an empty message when there are no collections", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness initial={[]} />);

    const dialog = await openDialog(user);

    expect(
      within(dialog).getByText(t("libraryWorkspace.emptyCollections")),
    ).toBeInTheDocument();
    expect(within(dialog).queryByRole("list")).not.toBeInTheDocument();
  });

  it("should create a collection, sort it into the list and clear the input", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);
    const nameInput = within(dialog).getByRole("textbox", {
      name: t("libraryWorkspace.collectionName"),
    });

    await user.type(nameInput, "  Classics  ");
    await user.click(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.createCollection"),
      }),
    );

    expect(
      await screen.findByText(t("libraryWorkspace.collectionCreated")),
    ).toBeInTheDocument();
    expect(collectionNames(dialog)).toEqual(["Classics", "Favourites", "Sci-fi"]);
    expect(nameInput).toHaveValue("");
  });

  it("should not create a collection from a blank name", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);

    await user.type(
      within(dialog).getByRole("textbox", {
        name: t("libraryWorkspace.collectionName"),
      }),
      "   ",
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.createCollection"),
      }),
    );

    expect(collectionNames(dialog)).toEqual(["Favourites", "Sci-fi"]);
    expect(server.collections.size).toBe(2);
  });

  it("should show the API error and keep the list when creating a duplicate", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);
    const nameInput = within(dialog).getByRole("textbox", {
      name: t("libraryWorkspace.collectionName"),
    });

    await user.type(nameInput, "Favourites");
    await user.click(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.createCollection"),
      }),
    );

    expect(await screen.findByText(DUPLICATE_ERROR)).toBeInTheDocument();
    expect(collectionNames(dialog)).toEqual(["Favourites", "Sci-fi"]);
    expect(nameInput).toHaveValue("Favourites");
  });

  it("should fall back to a default error when the API returns no message", async () => {
    const user = userEvent.setup();
    server.failNext = { status: 500, body: {} };
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);

    await user.type(
      within(dialog).getByRole("textbox", {
        name: t("libraryWorkspace.collectionName"),
      }),
      "Classics",
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.createCollection"),
      }),
    );

    expect(await screen.findByText("Something went wrong.")).toBeInTheDocument();
    expect(collectionNames(dialog)).toEqual(["Favourites", "Sci-fi"]);
  });

  it("should disable the form while a request is in progress", async () => {
    const user = userEvent.setup();
    let release!: () => void;
    server.hold = new Promise((resolve) => (release = resolve));
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);

    await user.type(
      within(dialog).getByRole("textbox", {
        name: t("libraryWorkspace.collectionName"),
      }),
      "Classics",
    );
    await user.click(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.createCollection"),
      }),
    );

    const createButton = within(dialog).getByRole("button", {
      name: t("libraryWorkspace.createCollection"),
    });
    expect(createButton).toBeDisabled();
    expect(createButton).toHaveAttribute("aria-busy", "true");
    expect(
      within(dialog).getByRole("textbox", {
        name: t("libraryWorkspace.collectionName"),
      }),
    ).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: t("libraryWorkspace.close") }),
    ).toBeDisabled();

    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    server.hold = undefined;
    release();

    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", {
          name: t("libraryWorkspace.createCollection"),
        }),
      ).toBeEnabled(),
    );
    expect(collectionNames(dialog)).toContain("Classics");
  });

  it("should rename a collection and keep the list sorted", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);
    const input = within(dialog).getByRole("textbox", {
      name: t("libraryWorkspace.renameCollection", { name: "Favourites" }),
    });

    await user.clear(input);
    await user.type(input, "Then Zines");
    await user.click(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.renameCollection", { name: "Favourites" }),
      }),
    );

    expect(
      await screen.findByText(t("libraryWorkspace.collectionRenamed")),
    ).toBeInTheDocument();
    expect(collectionNames(dialog)).toEqual(["Sci-fi", "Then Zines"]);
    expect(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.renameCollection", { name: "Then Zines" }),
      }),
    ).toBeInTheDocument();
  });

  it("should show the API error when a rename conflicts", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);
    const input = within(dialog).getByRole("textbox", {
      name: t("libraryWorkspace.renameCollection", { name: "Sci-fi" }),
    });

    await user.clear(input);
    await user.type(input, "Favourites{Enter}");

    expect(await screen.findByText(DUPLICATE_ERROR)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.renameCollection", { name: "Sci-fi" }),
      }),
    ).toBeInTheDocument();
  });

  it("should ask for confirmation before deleting and allow cancelling", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);

    await user.click(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.deleteCollection", { name: "Sci-fi" }),
      }),
    );

    const confirmation = within(dialog).getByRole("alertdialog");
    expect(confirmation).toHaveTextContent(
      t("libraryWorkspace.confirmDeleteCollection", { name: "Sci-fi" }),
    );

    await user.click(
      within(confirmation).getByRole("button", {
        name: t("libraryWorkspace.cancel"),
      }),
    );

    expect(within(dialog).queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(collectionNames(dialog)).toEqual(["Favourites", "Sci-fi"]);
  });

  it("should delete a collection after confirming", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);

    await user.click(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.deleteCollection", { name: "Sci-fi" }),
      }),
    );
    await user.click(
      within(within(dialog).getByRole("alertdialog")).getByRole("button", {
        name: t("libraryWorkspace.deleteCollection", { name: "Sci-fi" }),
      }),
    );

    expect(
      await screen.findByText(t("libraryWorkspace.collectionDeleted")),
    ).toBeInTheDocument();
    expect(collectionNames(dialog)).toEqual(["Favourites"]);
    expect(within(dialog).queryByRole("alertdialog")).not.toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: t("libraryWorkspace.close") }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      within(
        screen.getByRole("list", { name: "assigned collections" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(1);
  });

  it("should keep the collection and confirmation when deleting fails", async () => {
    const user = userEvent.setup();
    server.collections.delete("c2");
    renderWithIntl(<Harness />);
    const dialog = await openDialog(user);

    await user.click(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.deleteCollection", { name: "Sci-fi" }),
      }),
    );
    await user.click(
      within(within(dialog).getByRole("alertdialog")).getByRole("button", {
        name: t("libraryWorkspace.deleteCollection", { name: "Sci-fi" }),
      }),
    );

    expect(await screen.findByText(NOT_FOUND_ERROR)).toBeInTheDocument();
    expect(collectionNames(dialog)).toEqual(["Favourites", "Sci-fi"]);
    expect(within(dialog).getByRole("alertdialog")).toBeInTheDocument();
  });

  it("should clear a pending delete confirmation when reopened", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Harness />);
    let dialog = await openDialog(user);

    await user.click(
      within(dialog).getByRole("button", {
        name: t("libraryWorkspace.deleteCollection", { name: "Sci-fi" }),
      }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: t("libraryWorkspace.close") }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    dialog = await openDialog(user);

    expect(within(dialog).queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
