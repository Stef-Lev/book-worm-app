"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import Button from "@/components/button/button";
import TextInput from "@/components/text-input/text-input";
import { loginAction } from "@/actions/auth";
import type { AuthFormState } from "@/actions/auth";
import styles from "./login-form.module.css";

export default function LoginForm() {
  const t = useTranslations("auth");
  const [, action, pending] = useActionState<AuthFormState, FormData>(
    async (previous, formData) => {
      const next = await loginAction(previous, formData);
      if (next.error) toast.error(t(`errors.${next.error}`));
      return next;
    },
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
      <Button type="submit" loading={pending} className={styles.submit}>
        {t("loginSubmit")}
      </Button>
    </form>
  );
}
