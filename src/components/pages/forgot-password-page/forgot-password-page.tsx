"use client";

import { useState } from "react";
import Link from "@/components/navigation-link/navigation-link";
import AuthPageShell from "@/components/auth-page-shell/auth-page-shell";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";

export default function ForgotPasswordPage() {
  const t = useTranslations("pages.forgotPassword");
  const auth = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSubmitted(true);
        toast.success(t("emailSent"));
      } else {
        toast.error(t("error"));
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
      {submitted ? (
        <div style={{ textAlign: "center", color: "var(--color-text-secondary)" }}>
          <p>{t("checkEmail")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="email" style={{ display: "block", marginBottom: "0.5rem" }}>
              {auth("email")}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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
            {loading ? t("sending") : t("submit")}
          </button>
        </form>
      )}
    </AuthPageShell>
  );
}
