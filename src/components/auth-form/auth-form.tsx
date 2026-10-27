"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import Button from "@/components/button/button";
import TextInput from "@/components/text-input/text-input";
import type { AuthFormState } from "@/actions/auth";
import styles from "./auth-form.module.css";
import type { AuthFormProps } from "./auth-form.types";

export default function AuthForm({
  action: submit,
  fields,
  submitLabel,
}: AuthFormProps) {
  const t = useTranslations("auth");
  const [, action, pending] = useActionState<AuthFormState, FormData>(
    async (previous, formData) => {
      const next = await submit(previous, formData);
      if (next.error) toast.error(t(`errors.${next.error}`));
      return next;
    },
    {},
  );

  return (
    <form action={action} className={styles.form}>
      {fields.map((field) => (
        <TextInput
          key={field.name}
          {...field}
          required
          className={styles.input}
        />
      ))}
      <Button type="submit" loading={pending} className={styles.submit}>
        {submitLabel}
      </Button>
    </form>
  );
}
