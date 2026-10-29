import { Metadata } from "next";
import ProfilePage from "@/components/pages/profile-page/profile-page";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile, avatar, and account settings",
};

export default function Page() {
  return <ProfilePage />;
}
