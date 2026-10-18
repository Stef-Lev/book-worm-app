"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction } from "@/actions/auth";
import type { AuthFormState } from "@/actions/auth";
import styles from "./login-form.module.css";

export default function LoginForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthFormState, FormData>(loginAction, {});

  return (
    <form action={action} className={styles.form}>
      <label className={styles.field}>
        {t("email")}
        <input type="email" name="email" required autoComplete="email" className={styles.input} />
      </label>
      <label className={styles.field}>
        {t("password")}
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={styles.input}
        />
      </label>
      {state.error && (
        <p role="alert" className={styles.error}>
          {t(`errors.${state.error}`)}
        </p>
      )}
      <button type="submit" disabled={pending} className={styles.submit}>
        {t("loginSubmit")}
      </button>
    </form>
  );
}
