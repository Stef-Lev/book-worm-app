---
description: "Use when writing, adding, fixing or reviewing unit tests, component tests or spec files. Covers Vitest + React Testing Library setup, file naming, test names, i18n `t` usage, accessible queries and avoiding mocks."
applyTo: "**/*.spec.{ts,tsx}"
---

# Unit test conventions

## Tooling

- Vitest + React Testing Library (jsdom). Config: [vitest.config.mts](../../vitest.config.mts), setup: [src/test/setup.ts](../../src/test/setup.ts).
- Run: `npm test` (single run) or `npm run test:watch`.
- Simulate interactions with `@testing-library/user-event` (`const user = userEvent.setup()`), not `fireEvent`.

## Files and names

- Colocate the test in the component folder, named `<component>.spec.tsx` (e.g. `library-filters-sidebar/library-filters-sidebar.spec.tsx`).
- Every test name starts with `should`: `it("should show the reset button when filters change", ...)`.

## i18n

- Render with `renderWithIntl` and use the `t` helper from [src/test/utils.tsx](../../src/test/utils.tsx) for all static text — never hardcode translated strings.
- `t` takes the full key including namespace: `t("libraryWorkspace.reset")`.

```tsx
import { renderWithIntl, t } from "@/test/utils";

renderWithIntl(<MyComponent />);
expect(screen.getByRole("button", { name: t("libraryWorkspace.reset") })).toBeInTheDocument();
```

## Assertions

- Check text with `toHaveTextContent(...)`:

```ts
// ❌
expect(screen.getByRole("heading").textContent).toBe("Welcome");
// ✅
expect(screen.getByRole("heading")).toHaveTextContent("Welcome");
```

## Queries (accessibility first)

- Prefer `screen.*ByRole` with an accessible `name` (`button`, `heading`, `radio`, `checkbox`, `radiogroup`, `complementary`, `group`, …).
- Use `screen.*ByText` only when no role is available.
- Never use `*ByTestId`.

## Next.js and server components

- [src/test/setup.ts](../../src/test/setup.ts) globally provides:
  - `next/navigation` backed by [src/test/navigation.ts](../../src/test/navigation.ts): use `setPathname`, `setSearchParams` to arrange state and `testRouter` to check navigation. `redirect()` throws a `RedirectError`. Everything resets after each test.
  - `next-intl/server` (`getTranslations`, `getLocale`, `getFormatter`) backed by `en.json`.
- `next/link` and `next/image` work as-is; don't mock them.
- jsdom gaps already filled in setup: `hasPointerCapture`/`releasePointerCapture`/`scrollIntoView` (Radix Select) and `ResizeObserver` (Ark popovers). Stub `matchMedia` per spec when the result matters (theme, breakpoints).
- Components that open Ark dialogs or show toasts need the real `ToastProvider` around them (it renders the `#notifications` element dialogs rely on); assert toast text inside it.
- Render async server components by awaiting them: `renderWithIntl(await NotFoundPage())`.

## Test behaviour, not implementation

- Assert on visible UI changes instead of mocks or spies (`vi.fn`, `vi.spyOn`).
- Only mock true boundaries the test environment can't provide (server actions, `@/auth`, `next-auth/react` session, network). For network, stub `fetch` with an in-memory fake (`vi.stubGlobal("fetch", ...)`) that returns realistic responses, then assert on the resulting UI rather than on call arguments.
- For controlled components that take `value`/`onChange` props, render them inside a small stateful harness in the spec so interactions update the UI:

```tsx
function Harness() {
  const [values, setValues] = useState(defaults);
  return (
    <MyFilters
      values={values}
      onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
      onClear={() => setValues(defaults)}
    />
  );
}
```
