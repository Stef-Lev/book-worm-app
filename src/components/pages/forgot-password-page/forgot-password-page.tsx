"use client";

import { useState } from "react";
import Link from "@/components/navigation-link/navigation-link";
import AuthPageShell from "@/components/auth-page-shell/auth-page-shell";
import Button from "@/components/button/button";
import TextInput from "@/components/text-input/text-input";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import styles from "./forgot-password-page.module.css";

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
        <div className={styles.successMessage}>
          <p>{t("checkEmail")}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.form}>
          <TextInput
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            label={auth("email")}
          />
          <Button type="submit" loading={loading}>
            {t("submit")}
          </Button>
        </form>
      )}
    </AuthPageShell>
  );
}

