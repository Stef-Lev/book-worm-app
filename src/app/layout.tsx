import type { Metadata } from "next";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { Geist, Geist_Mono } from "next/font/google";
import RouteLoading from "@/components/route-loading/route-loading";
import ToastProvider from "@/components/toast-provider/toast-provider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, Locale } from "@/i18n/config";
import { THEME_COOKIE, Theme } from "@/lib/preferences";
import "@/styles/global.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PaperSmell",
  description: "Track your reading.",
};

// @TODO: Create functionality for forgot password
// @TODO: Scrape public to create an API for greek books, check bookshark
// @TODO: Clean results when the input is cleared
// @TODO: Analytics, show percentage of whole library completed
// @TODO: Edit book details functionality
// @TODO: Implement user profile management
// @TODO: Add hover cursor pointer where needed

// Applies the saved theme/locale before paint so the static shell never flashes
const themePattern = `${THEME_COOKIE}=(${Theme.Light}|${Theme.Dark})`;
const localePattern = `${LOCALE_COOKIE}=(${Object.values(Locale).join("|")})`;
const preferencesScript = `(function(){try{var c=document.cookie,t=c.match(/(?:^|; )${themePattern}/),l=c.match(/(?:^|; )${localePattern}/),d=document.documentElement;if(t)d.dataset.theme=t[1];if(l)d.lang=l[1];}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferencesScript }} />
      </head>
      <body>
        <Suspense fallback={<RouteLoading />}>
          <NextIntlClientProvider>
            <ToastProvider>{children}</ToastProvider>
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
