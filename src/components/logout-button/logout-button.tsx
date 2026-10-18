import { getTranslations } from "next-intl/server";
import { logoutAction } from "@/actions/auth";
import styles from "./logout-button.module.css";

export default async function LogoutButton() {
  const t = await getTranslations("nav");

  return (
    <form action={logoutAction}>
      <button type="submit" className={styles.button}>
        {t("logout")}
      </button>
    </form>
  );
}
