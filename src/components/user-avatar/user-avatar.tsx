"use client";

import { useState, useEffect } from "react";
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
}: UserAvatarProps) {
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/profile/avatar");
        if (res.ok) {
          const blob = await res.blob();
          setAvatarUrl(URL.createObjectURL(blob));
        }
      } catch (error) {
        console.error("Failed to fetch avatar:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchAvatar();
    }
  }, [session?.user]);

  const initials = session?.user?.name
    ?.split(" ")
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2) || "U";

  const avatarContent = (
    <div className={`${styles.avatar} ${styles[size]}`} title={session?.user?.name || "User"}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={session?.user?.name || "User avatar"} className={styles.image} />
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
