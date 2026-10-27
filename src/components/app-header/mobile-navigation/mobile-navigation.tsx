"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import IconButton from "@/components/icon-button/icon-button";
import Link from "@/components/navigation-link/navigation-link";
import { getNotificationRegion } from "@/lib/notifications";
import type { MobileNavigationProps } from "./mobile-navigation.types";
import styles from "./mobile-navigation.module.css";

export default function MobileNavigation({
  links,
  children,
}: MobileNavigationProps) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 64rem)");
    function closeOnDesktop() {
      if (desktop.matches) setOpen(false);
    }
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [open]);

  return (
    <Dialog.Root
      persistentElements={[getNotificationRegion]}
      open={open}
      onOpenChange={({ open: nextOpen }) => setOpen(nextOpen)}
      lazyMount
      unmountOnExit
    >
      <Dialog.Trigger asChild>
        <IconButton label={t("menu")} className={styles.trigger}>
          <Menu aria-hidden="true" />
        </IconButton>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Positioner className={styles.positioner}>
          <Dialog.Content className={styles.drawer}>
            <div className={styles.header}>
              <Dialog.Title className={styles.title}>{t("menu")}</Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <IconButton label={t("closeMenu")}>
                  <X aria-hidden="true" />
                </IconButton>
              </Dialog.CloseTrigger>
            </div>
            <nav className={styles.links} aria-label={t("menu")}>
              {links.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}>
                  {label}
                </Link>
              ))}
            </nav>
            <div className={styles.account}>{children}</div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
