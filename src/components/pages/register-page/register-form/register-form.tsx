"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { registerAction } from "@/actions/auth";
import type { AuthFormState } from "@/actions/auth";
import styles from "./register-form.module.css";

export default function RegisterForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthFormState, FormData>(registerAction, {});

  return (
    <form action={action} className={styles.form}>
      <label className={styles.field}>
        {t("name")}
        <input type="text" name="name" required autoComplete="name" className={styles.input} />
      </label>
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
          minLength={8}
          autoComplete="new-password"
          className={styles.input}
        />
        <span className={styles.hint}>{t("passwordHint")}</span>
      </label>
      {state.error && (
        <p role="alert" className={styles.error}>
          {t(`errors.${state.error}`)}
        </p>
      )}
      <button type="submit" disabled={pending} className={styles.submit}>
        {t("registerSubmit")}
      </button>
    </form>
  );
}
