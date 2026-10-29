"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "@/components/navigation-link/navigation-link";
import AuthPageShell from "@/components/auth-page-shell/auth-page-shell";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";

export default function ResetPasswordPage() {
  const t = useTranslations("pages.resetPassword");
  const auth = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <AuthPageShell
        title={t("title")}
        description={t("invalidLink")}
        footer={
          <Link href="/login">{auth("loginTitle")}</Link>
        }
      >
        <p style={{ color: "var(--color-error)" }}>{t("invalidLink")}</p>
      </AuthPageShell>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t("passwordMismatch"));
      return;
    }

    if (password.length < 6) {
      toast.error(t("passwordTooShort"));
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t("success"));
        router.push("/login");
      } else {
        toast.error(data.error || t("error"));
      }
    } catch {
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      footer={
        <>
          {auth("haveAccount")} <Link href="/login">{auth("loginTitle")}</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="password" style={{ display: "block", marginBottom: "0.5rem" }}>
            {auth("password")}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
            }}
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="confirmPassword" style={{ display: "block", marginBottom: "0.5rem" }}>
            {t("confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid var(--color-border)",
              borderRadius: "0.5rem",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: loading ? "var(--color-text-tertiary)" : "var(--color-primary)",
            color: "white",
            border: "none",
            borderRadius: "0.5rem",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? t("resetting") : t("submit")}
        </button>
      </form>
    </AuthPageShell>
  );
}
