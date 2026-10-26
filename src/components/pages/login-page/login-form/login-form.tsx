"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/button/button";
import TextInput from "@/components/text-input/text-input";
import FeedbackMessage from "@/components/feedback-message/feedback-message";
import { loginAction } from "@/actions/auth";
import type { AuthFormState } from "@/actions/auth";
import styles from "./login-form.module.css";

export default function LoginForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={action} className={styles.form}>
      <TextInput
        label={t("email")}
        type="email"
        name="email"
        required
        autoComplete="email"
        className={styles.input}
      />
      <TextInput
        label={t("password")}
        type="password"
        name="password"
        required
        autoComplete="current-password"
        className={styles.input}
      />
      <FeedbackMessage tone="error">
        {state.error ? t(`errors.${state.error}`) : null}
      </FeedbackMessage>
      <Button type="submit" loading={pending} className={styles.submit}>
        {t("loginSubmit")}
      </Button>
    </form>
  );
}
