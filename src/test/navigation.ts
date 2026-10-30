import { vi } from "vitest";

// In-memory stand-in for the App Router, which is not mounted in jsdom.
export const testRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

const state = {
  pathname: "/",
  searchParams: new URLSearchParams(),
};

export function setPathname(pathname: string) {
  state.pathname = pathname;
}

export function setSearchParams(params: Record<string, string> | string) {
  state.searchParams = new URLSearchParams(params);
}

export function getPathname() {
  return state.pathname;
}

export function getSearchParams() {
  return state.searchParams;
}

export class RedirectError extends Error {
  constructor(public readonly url: string) {
    super(`NEXT_REDIRECT:${url}`);
  }
}

export function resetNavigation() {
  state.pathname = "/";
  state.searchParams = new URLSearchParams();
  Object.values(testRouter).forEach((fn) => fn.mockReset());
}
