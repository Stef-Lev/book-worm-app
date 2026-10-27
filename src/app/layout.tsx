import type { Metadata } from "next";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { Geist, Geist_Mono } from "next/font/google";
import RouteLoading from "@/components/route-loading/route-loading";
import ToastProvider from "@/components/toast-provider/toast-provider";
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

// Applies the saved theme/locale before paint so the static shell never flashes
const preferencesScript = `(function(){try{var c=document.cookie,t=c.match(/(?:^|; )theme=(light|dark)/),l=c.match(/(?:^|; )locale=(en|el)/),d=document.documentElement;if(t)d.dataset.theme=t[1];if(l)d.lang=l[1];}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
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
