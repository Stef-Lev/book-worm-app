import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import IconButton from "@/components/icon-button/icon-button";
import { logoutAction } from "@/actions/auth";
import styles from "./logout-button.module.css";

export default async function LogoutButton() {
  const t = await getTranslations("nav");

  return (
    <form action={logoutAction} className={styles.form}>
      <IconButton type="submit" label={t("logout")}>
        <LogOut aria-hidden="true" />
      </IconButton>
    </form>
  );
}
