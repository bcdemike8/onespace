import { redirect } from "next/navigation";

/**
 * The account page became the profile page.
 *
 * Kept as a redirect rather than deleted: this URL is in the sidebar of
 * every browser tab anybody left open, and in at least one Slack message.
 */
export default function AccountPage() {
  redirect("/profile");
}
