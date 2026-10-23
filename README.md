This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## UI theme

Both authenticated and account layouts wait for an incoming request using
`connection()` before calling Auth.js. Session handling uses cryptographic
randomness and must not run during static prerendering with Cache Components.
Each layout renders its request-time authentication inside a local Suspense
boundary with a static loading placeholder. Route-group loading boundaries also
cover page-level data access during navigation below a shared layout. Keep both
boundaries: Suspense in the root layout alone does not cover these transitions.

The interface uses teal (`#377D80`) for primary actions and coral (`#FF9182`)
for secondary actions and highlights. Shared light and dark color tokens live in
[`src/styles/colors.css`](src/styles/colors.css); components use semantic tokens
so explicit and system-selected themes stay consistent. Coral backgrounds use
dark text, and keyboard focus uses a contrasting teal outline.

Component styles are CSS Modules, with spacing and radius tokens from
[`src/styles/`](src/styles/) and mobile-first custom-media breakpoints. Keep the
same button, field, and card treatments across account and library screens.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
