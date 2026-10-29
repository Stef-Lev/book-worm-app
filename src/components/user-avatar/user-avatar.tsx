"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import Link from "@/components/navigation-link/navigation-link";
import styles from "./user-avatar.module.css";
import type { UserAvatarProps } from "./user-avatar.types";

export default function UserAvatar({
  size = "medium",
  as = "link",
  href = "/profile",
  onClick,
  children,
  userName,
  userEmail,
}: UserAvatarProps) {
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);

  const displayName = userName || session?.user?.name;

  useEffect(() => {
    const userId = session?.user?.id || userEmail;

    if (!userId || userIdRef.current === userId) {
      return;
    }

    if (fetchedRef.current && userIdRef.current === userId) {
      return;
    }

    userIdRef.current = userId;
    fetchedRef.current = true;

    const fetchAvatar = async () => {
      try {
        const res = await fetch("/api/profile/avatar");
        if (res.ok) {
          const blob = await res.blob();
          setAvatarUrl(URL.createObjectURL(blob));
        } else if (res.status !== 404) {
          console.error("Failed to fetch avatar: HTTP", res.status);
        }
      } catch (error) {
        console.error("Failed to fetch avatar:", error);
      }
    };

    fetchAvatar();
  }, [session?.user?.id, userEmail]);

  const initials =
    displayName
      ?.split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "U";

  const avatarContent = (
    <div
      className={`${styles.avatar} ${styles[size]}`}
      title={displayName || "User"}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={displayName || "User avatar"}
          className={styles.image}
          width={48}
          height={48}
          unoptimized
        />
      ) : (
        <div className={styles.initials}>{initials}</div>
      )}
      {children}
    </div>
  );

  if (as === "button") {
    return (
      <button onClick={onClick} className={styles.button}>
        {avatarContent}
      </button>
    );
  }

  return (
    <Link href={href} onClick={onClick}>
      {avatarContent}
    </Link>
  );
}
