"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import Button from "@/components/button/button";
import TextInput from "@/components/text-input/text-input";
import { registerAction } from "@/actions/auth";
import type { AuthFormState } from "@/actions/auth";
import styles from "./register-form.module.css";

export default function RegisterForm() {
  const t = useTranslations("auth");
  const [, action, pending] = useActionState<AuthFormState, FormData>(
    async (previous, formData) => {
      const next = await registerAction(previous, formData);
      if (next.error) toast.error(t(`errors.${next.error}`));
      return next;
    },
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
      <Button type="submit" loading={pending} className={styles.submit}>
        {t("registerSubmit")}
      </Button>
    </form>
  );
}
