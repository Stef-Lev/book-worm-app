"use client";

import { useLinkStatus } from "next/link";
import { createPortal } from "react-dom";
import RouteLoading from "@/components/route-loading/route-loading";

export default function NavigationLoading() {
  const { pending } = useLinkStatus();
  return pending ? createPortal(<RouteLoading />, document.body) : null;
}
