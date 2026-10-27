import type { Metadata } from "next";
import UnauthorizedPage from "@/components/pages/unauthorized-page/unauthorized-page";

export const metadata: Metadata = {
  title: "401 | PaperSmell",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <UnauthorizedPage />;
}
