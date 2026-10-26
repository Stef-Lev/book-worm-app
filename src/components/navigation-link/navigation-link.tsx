import Link from "next/link";
import NavigationLoading from "@/components/navigation-link/navigation-loading/navigation-loading";
import type { NavigationLinkProps } from "./navigation-link.types";

export default function NavigationLink({ children, ...props }: NavigationLinkProps) {
  return (
    <Link {...props}>
      {children}
      <NavigationLoading />
    </Link>
  );
}
