"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import Button from "@/components/button/button";
import TextInput from "@/components/text-input/text-input";
import FeedbackMessage from "@/components/feedback-message/feedback-message";
import { registerAction } from "@/actions/auth";
import type { AuthFormState } from "@/actions/auth";
import styles from "./register-form.module.css";

export default function RegisterForm() {
  const t = useTranslations("auth");
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    registerAction,
    {},
  );

  return (
    <form action={action} className={styles.form}>
      <TextInput
        label={t("name")}
        name="name"
        required
        autoComplete="name"
        className={styles.input}
      />
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
        hint={t("passwordHint")}
        type="password"
        name="password"
        required
        minLength={8}
        autoComplete="new-password"
        className={styles.input}
      />
      <FeedbackMessage tone="error">
        {state.error ? t(`errors.${state.error}`) : null}
      </FeedbackMessage>
      <Button type="submit" loading={pending} className={styles.submit}>
        {t("registerSubmit")}
      </Button>
    </form>
  );
}
