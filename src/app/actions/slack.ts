"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { authTest, listChannels, lookupByEmail, slackConfigured } from "@/lib/slack/client";

export type ActionState = { error?: string; ok?: boolean; message?: string };

/**
 * Match every active person to their Slack account by email.
 *
 * Email is the only join that doesn't need someone to type an id, and Slack's
 * lookupByEmail is exact — a miss means they genuinely aren't in the workspace
 * under that address, which is worth reporting rather than guessing around.
 */
export async function linkSlackAccountsAction(): Promise<ActionState> {
  await requireAdmin();
  if (!slackConfigured()) {
    return { error: "Set SLACK_BOT_TOKEN in Railway first." };
  }

  const people = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, email: true, slackUserId: true },
    orderBy: { name: "asc" },
  });

  let linked = 0;
  const missing: string[] = [];

  for (const person of people) {
    const id = await lookupByEmail(person.email);
    if (!id) {
      missing.push(person.name);
      continue;
    }
    if (person.slackUserId === id) continue;

    // Two OneSpace accounts can't share one Slack account: the id is unique, so
    // clear it off whoever holds it before claiming it.
    await db.user.updateMany({
      where: { slackUserId: id, NOT: { id: person.id } },
      data: { slackUserId: null },
    });
    await db.user.update({ where: { id: person.id }, data: { slackUserId: id } });
    linked += 1;
  }

  revalidatePath("/people", "layout");

  const parts = [`Linked ${linked} ${linked === 1 ? "person" : "people"}.`];
  if (missing.length > 0) {
    parts.push(
      `No Slack account found for ${missing.join(", ")} — check the email matches their Slack profile.`,
    );
  }
  return { ok: true, message: parts.join(" ") };
}

export interface SlackStatus {
  configured: boolean;
  connected: boolean;
  team?: string;
  error?: string;
  linked: number;
  unlinked: string[];
}

export async function slackStatus(): Promise<SlackStatus> {
  const people = await db.user.findMany({
    where: { isActive: true },
    select: { name: true, slackUserId: true },
    orderBy: { name: "asc" },
  });
  const linked = people.filter((p) => p.slackUserId).length;
  const unlinked = people.filter((p) => !p.slackUserId).map((p) => p.name);

  if (!slackConfigured()) {
    return { configured: false, connected: false, linked, unlinked };
  }
  const test = await authTest();
  return {
    configured: true,
    connected: test.ok,
    team: test.data?.team,
    error: test.error,
    linked,
    unlinked,
  };
}

/** Channels the bot can post to, for the project picker. */
export async function slackChannelOptions() {
  if (!slackConfigured()) return [];
  const channels = await listChannels();
  return channels
    .filter((c) => c.is_member)
    .map((c) => ({ id: c.id, name: c.name, isPrivate: c.is_private }));
}
