"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import styles from "./book-cover.module.css";
import type { BookCoverProps } from "./book-cover.types";

export default function BookCover({
  src,
  alt = "",
  className,
}: BookCoverProps) {
  const [failedSrc, setFailedSrc] = useState<string>();

  return (
    <span className={cn(styles.cover, className)}>
      {src && src !== failedSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- Catalog and manual covers can use arbitrary external URLs.
        <img
          className={styles.image}
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <span
          className={styles.placeholder}
          role={alt ? "img" : undefined}
          aria-label={alt || undefined}
          aria-hidden={alt ? undefined : true}
        >
          <BookOpen className={styles.icon} aria-hidden="true" />
        </span>
      )}
    </span>
  );
}
