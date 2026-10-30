import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Session } from "next-auth";
import { useSession } from "next-auth/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UserAvatar from "@/components/user-avatar/user-avatar";
import { renderWithIntl } from "@/test/utils";
import { AvatarProvider, useAvatar } from "./avatar-provider";

// The session comes from next-auth, which needs a real auth backend.
vi.mock("next-auth/react", () => ({ useSession: vi.fn() }));

const AVATAR_URL = "blob:http://localhost/avatar";

function signIn(user: Session["user"] | null) {
  vi.mocked(useSession).mockReturnValue(
    (user
      ? { data: { user, expires: "2099-01-01" }, status: "authenticated" }
      : { data: null, status: "unauthenticated" }) as ReturnType<
      typeof useSession
    >,
  );
}

function stubAvatarApi(responses: Array<() => Response | Promise<Response>>) {
  const queue = [...responses];
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    if (String(input) !== "/api/profile/avatar")
      return new Response(null, { status: 404 });
    const next = queue.shift() ?? (() => new Response(null, { status: 404 }));
    return next();
  });
}

function avatarImage() {
  return new Response(new Blob(["png"], { type: "image/png" }), {
    status: 200,
  });
}

function RefreshButton() {
  const { refreshAvatar, isLoading } = useAvatar();
  return (
    <button type="button" onClick={() => void refreshAvatar()}>
      {isLoading ? "Loading avatar" : "Refresh avatar"}
    </button>
  );
}

function renderWithProvider() {
  return renderWithIntl(
    <AvatarProvider>
      <UserAvatar userName="Jane Doe" />
      <RefreshButton />
    </AvatarProvider>,
  );
}

describe("AvatarProvider", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = () => AVATAR_URL;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should show initials when there is no signed in user", async () => {
    signIn(null);
    stubAvatarApi([avatarImage]);
    renderWithProvider();

    expect(await screen.findByText("JD")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("should load and show the avatar for a signed in user", async () => {
    signIn({ id: "user-1", name: "Jane Doe" });
    stubAvatarApi([avatarImage]);
    renderWithProvider();

    expect(
      await screen.findByRole("img", { name: "Jane Doe" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("JD")).not.toBeInTheDocument();
  });

  it("should keep the initials when the avatar request fails", async () => {
    signIn({ id: "user-1", name: "Jane Doe" });
    stubAvatarApi([() => new Response(null, { status: 404 })]);
    renderWithProvider();

    expect(
      await screen.findByRole("button", { name: "Refresh avatar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("should keep the initials when the avatar request throws", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    signIn({ id: "user-1", name: "Jane Doe" });
    stubAvatarApi([
      () => {
        throw new TypeError("Network error");
      },
    ]);
    renderWithProvider();

    expect(
      await screen.findByRole("button", { name: "Refresh avatar" }),
    ).toBeInTheDocument();
    expect(screen.getByText("JD")).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it("should show the new avatar after it is refreshed", async () => {
    const user = userEvent.setup();
    signIn({ id: "user-1", name: "Jane Doe" });
    stubAvatarApi([
      () => new Response(null, { status: 404 }),
      avatarImage,
      avatarImage,
    ]);
    renderWithProvider();

    await user.click(
      await screen.findByRole("button", { name: "Refresh avatar" }),
    );

    expect(
      await screen.findByRole("img", { name: "Jane Doe" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Refresh avatar" }),
      ).toBeInTheDocument(),
    );
  });

  it("should throw when useAvatar is used outside the provider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => renderWithIntl(<RefreshButton />)).toThrow(
      "useAvatar must be used within AvatarProvider",
    );
    consoleError.mockRestore();
  });
});
