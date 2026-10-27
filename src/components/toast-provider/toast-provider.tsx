"use client";

import { ToastContainer } from "react-toastify";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import type { ToastProviderProps } from "./toast-provider.types";
import styles from "./toast-provider.module.css";

export default function ToastProvider({ children }: ToastProviderProps) {
  const t = useTranslations("notifications");

  return (
    <>
      {children}
      <div id="notifications" aria-live="polite">
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          limit={3}
          newestOnTop
          closeOnClick
          draggable={false}
          aria-label={t("label")}
          className={styles.container}
          toastClassName={styles.toast}
          closeButton={({ closeToast }) => (
            <button
              type="button"
              onClick={closeToast}
              aria-label={t("dismiss")}
              title={t("dismiss")}
              className={styles.close}
            >
              <X aria-hidden="true" />
            </button>
          )}
        />
      </div>
    </>
  );
}
