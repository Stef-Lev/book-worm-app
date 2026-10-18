---
name: create-component
description: Create React components in the Bookworm app following project conventions (folder-per-component in kebab-case, <name>.types.ts, CSS Module, subcomponent subfolders, page content vs. shared components). Use when asked to create, add, scaffold or split a component or page content.
---

# Create a component

## Where it goes

| Kind | Location |
|------|----------|
| Page content (the component rendered by an App Router `page.tsx`) | `src/components/pages/<page-name>/` |
| Every other component | `src/components/<component-name>/` |

Do NOT create `src/pages/`: Next.js treats it as the legacy Pages Router and it would conflict with `src/app/`.

`page.tsx` files stay thin: fetch data / check auth on the server, then render the page content component.

```tsx
// src/app/library/page.tsx
import LibraryPage from "@/components/pages/library-page/library-page";

export default function Page() {
  return <LibraryPage />;
}
```

## Folder structure

Each component lives in its own folder, named in kebab-case (the folder and component file use the same name):

```
book-card/
├── book-card.tsx          # component, default export, PascalCase name (BookCard)
├── book-card.types.ts     # prop types (and other types for this component)
├── book-card.module.css   # CSS Module styles
└── cover-image/           # subcomponent -> its own subfolder, same structure
    ├── cover-image.tsx
    ├── cover-image.types.ts
    └── cover-image.module.css
```

Rules:
1. One component per folder. Never put two components in the same folder.
2. Subcomponents (used only by their parent) go in a subfolder of the parent, and follow the same structure recursively. A component used by multiple unrelated components goes to `src/components/` instead.
3. Props are typed in `<name>.types.ts` and exported as `<ComponentName>Props`. No inline prop types in the `.tsx` file.
4. Styles go in `<name>.module.css`, imported as `styles`. Use camelCase class names. No inline styles or global CSS for components.
5. Styles are mobile-first and responsive (`min-width` media queries, `clamp`, flex/grid).
6. Always use design tokens (see below) for spacing, font size, font weight, colors and border radius. No hard-coded `rem`/`px`/hex values for those.
7. Always use CSS logical properties instead of physical ones (see below).
8. Components are Server Components by default; add `"use client"` only when hooks or event handlers are needed.
9. Use the `@/` import alias, never deep relative paths such as `../../..`.
10. No barrel/`index.ts` files.

## Design tokens

Tokens are CSS custom properties in `src/styles/`, modeled on Tailwind's scales. `src/styles/global.css` imports all of them and is imported once in `src/app/layout.tsx`. Add new tokens to the matching file, never to a component.

| File | Tokens | Examples |
|------|--------|----------|
| `spacing.css` | `--space-*` (1 unit = 0.25rem, like Tailwind) | `--space-1`, `--space-2-5` (2.5), `--space-4`, `--space-8` |
| `font-size.css` | `--font-size-*` (xs to 9xl), `--line-height-*` | `--font-size-sm`, `--font-size-xl`, `--line-height-tight` |
| `font-weight.css` | `--font-weight-*` (thin to black) | `--font-weight-medium`, `--font-weight-bold` |
| `colors.css` | `--color-<palette>-<50..950>` palettes, plus semantic `--color-*` that switch with light/dark | `--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border`, `--color-primary`, `--color-danger` |
| `border-radius.css` | `--radius-*` (none, xs to 4xl, full) | `--radius-md`, `--radius-lg`, `--radius-full` |

In components prefer the semantic colors (`--color-text`, `--color-primary`...) so dark mode works automatically; use palette colors only when no semantic token fits. Layout helpers in `global.css`: `--container`, `--page-padding`.

Use `calc(var(--space-4) * 2)` or the next scale step for values between tokens; if a value is needed repeatedly, add a token.

## Logical properties

The project uses logical (writing-mode aware) properties. Never use `left`/`right`/`top`/`bottom`/`width`/`height` physical equivalents.

| Instead of | Use |
|------------|-----|
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `margin-top` / `margin-bottom` | `margin-block-start` / `margin-block-end` |
| `margin: 0 auto` | `margin-inline: auto` |
| `padding-left/right`, `padding-top/bottom` | `padding-inline-start/end`, `padding-block-start/end` (or `padding-inline` / `padding-block`) |
| `width` / `height` | `inline-size` / `block-size` |
| `min-width` / `max-width` | `min-inline-size` / `max-inline-size` |
| `min-height` / `max-height` | `min-block-size` / `max-block-size` |
| `left` / `right` / `top` / `bottom` | `inset-inline-start` / `inset-inline-end` / `inset-block-start` / `inset-block-end` |
| `text-align: left/right` | `text-align: start/end` |
| `border-left`, `border-top` | `border-inline-start`, `border-block-start` |
| `border-top-left-radius` | `border-start-start-radius` (top-left), `border-start-end-radius` (top-right), `border-end-start-radius`, `border-end-end-radius` |
| `float: left/right` | `float: inline-start/inline-end` |

Media queries may still use `min-width`.

## Templates

`book-card.types.ts`
```ts
export type BookCardProps = {
  title: string;
  author: string;
};
```

`book-card.tsx`
```tsx
import styles from "./book-card.module.css";
import type { BookCardProps } from "./book-card.types";

export default function BookCard({ title, author }: BookCardProps) {
  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.author}>{author}</p>
    </article>
  );
}
```

`book-card.module.css`
```css
.card {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.title {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.author {
  margin-block: var(--space-1) 0;
  margin-inline: 0;
  color: var(--color-muted);
  font-size: var(--font-size-sm);
}
```

## Checklist

1. Decide: page content (`components/pages/`) or shared component (`components/`).
2. Create the kebab-case folder with `<name>.tsx`, `<name>.types.ts`, `<name>.module.css`.
3. Create subfolders for subcomponents, each with the same three files.
4. Style only with tokens from `src/styles/` and logical properties.
5. Run `npx tsc --noEmit` and `npm run lint`.
