"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { isAdmin, requireAdmin, requireUser } from "@/lib/auth";
import { resolveRates } from "@/lib/rates";
import { assertUnlocked } from "@/lib/lock";
import { dayInZone } from "@/lib/dates";
import { parseDuration } from "@/lib/format";
import { googleConfigured } from "@/lib/google/auth";
import { orgTimezone, syncCalendars } from "@/lib/google/sync";

export type ActionState = { error?: string; ok?: boolean; message?: string };

const REVALIDATE = ["/", "/meetings", "/timesheet", "/reports", "/projects"];
const refresh = () => REVALIDATE.forEach((p) => revalidatePath(p, "layout"));

// ------------------------------------------------------------------- sync

/**
 * Pull calendars now. Anyone may sync their own; only an admin may pull
 * everybody's, because that reads seven people's diaries in one click.
 */
export async function syncCalendarAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const everyone = formData.get("scope") === "all";
  if (everyone && !isAdmin(user)) {
    return { error: "Only an admin can sync everyone's calendar." };
  }

  try {
    const r = await syncCalendars(everyone ? {} : { userId: user.id });
    refresh();

    if (r.people === 0 && r.failed.length > 0) {
      return { error: r.failed[0].error };
    }

    // The one failure that looks like every other failure: no domains at all.
    // Listing the domains it didn't recognise implies some are recognised,
    // which sends you looking for a subtle mismatch that isn't there.
    if (r.mappedDomains === 0) {
      return {
        error: `No client has an email domain yet, so nothing can match — ${r.seen} meetings were read and all of them skipped. Add domains on the Clients page, or run sql/onespace-client-domains-filled.sql.`,
      };
    }

    const bits = [
      `${r.created} new meeting${r.created === 1 ? "" : "s"}`,
      `${r.matched} matched to a project`,
    ];
    if (r.settled > 0) bits.push(`${r.settled} already dealt with`);
    if (r.skipped > 0) bits.push(`${r.skipped} skipped with no client in the room`);
    if (r.failed.length > 0) {
      bits.push(`couldn't read ${r.failed.map((f) => f.name).join(", ")}`);
    }
    const hint =
      r.unrecognised.length > 0
        ? ` Most-seen unmapped domains: ${r.unrecognised
            .slice(0, 5)
            .map((u) => `${u.domain} (${u.meetings})`)
            .join(", ")}.`
        : "";

    return { ok: true, message: `${bits.join(", ")}.${hint}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "The calendar sync failed." };
  }
}

// -------------------------------------------------------------- decisions

const acceptSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().trim().min(1, "Pick a project."),
  taskId: z.string().trim().optional().nullable(),
  duration: z.string().trim().min(1, "Enter how long it took."),
  notes: z.string().trim().max(1000).optional().nullable(),
  billable: z.string().optional().nullable(),
});

/**
 * Turn a suggested meeting into real time.
 *
 * The date comes from the meeting's start in the org's timezone, not from
 * anything the form says: a 4pm Central call is Central's Tuesday even when
 * the server thinks it is already Wednesday.
 */
export async function acceptMeetingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = acceptSchema.safeParse({
    id: formData.get("id"),
    projectId: formData.get("projectId"),
    taskId: formData.get("taskId") || null,
    duration: formData.get("duration"),
    notes: formData.get("notes"),
    billable: formData.get("billable"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const meeting = await db.meeting.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, userId: true, status: true, startsAt: true, title: true },
  });
  if (!meeting) return { error: "That meeting is no longer here." };
  if (meeting.userId !== user.id && !isAdmin(user)) {
    return { error: "That's someone else's calendar." };
  }
  if (meeting.status === "ACCEPTED") {
    return { error: "That meeting is already on a timesheet." };
  }

  const minutes = parseDuration(parsed.data.duration);
  if (minutes === null || minutes <= 0) {
    return { error: "That duration didn't make sense. Try 1.5, 1:30 or 90m." };
  }
  if (minutes > 24 * 60) return { error: "That's more than 24 hours." };

  const date = dayInZone(meeting.startsAt, await orgTimezone());
  try {
    await assertUnlocked(date);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "That period is closed." };
  }

  const billableOverride =
    formData.get("billable") === null ? undefined : parsed.data.billable === "on";
  const rates = await resolveRates(meeting.userId, parsed.data.projectId, billableOverride);

  // One transaction: an entry without its link would be re-suggested on the
  // next sync and booked twice.
  await db.$transaction(async (tx) => {
    const entry = await tx.timeEntry.create({
      data: {
        userId: meeting.userId,
        projectId: parsed.data.projectId,
        taskId: parsed.data.taskId || null,
        date,
        minutes,
        notes: parsed.data.notes || meeting.title,
        source: "MANUAL",
        ...rates,
      },
    });

    await tx.meeting.update({
      where: { id: meeting.id },
      data: {
        status: "ACCEPTED",
        projectId: parsed.data.projectId,
        taskId: parsed.data.taskId || null,
        timeEntryId: entry.id,
      },
    });
  });

  refresh();
  return { ok: true };
}

export async function dismissMeetingAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const meeting = await db.meeting.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!meeting) return;
  if (meeting.userId !== user.id && !isAdmin(user)) return;

  await db.meeting.update({ where: { id }, data: { status: "DISMISSED" } });
  refresh();
}

/**
 * Put a meeting back in the list.
 *
 * An accepted one takes its time entry with it, so undo really is undo rather
 * than leaving an orphan hour behind. Locked months refuse, same as anywhere
 * else that deletes time.
 */
export async function reopenMeetingAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const meeting = await db.meeting.findUnique({
    where: { id },
    select: { userId: true, timeEntryId: true, timeEntry: { select: { date: true } } },
  });
  if (!meeting) return;
  if (meeting.userId !== user.id && !isAdmin(user)) return;

  if (meeting.timeEntry) await assertUnlocked(meeting.timeEntry.date);

  await db.$transaction(async (tx) => {
    await tx.meeting.update({
      where: { id },
      data: { status: "PENDING", timeEntryId: null },
    });
    if (meeting.timeEntryId) {
      await tx.timeEntry.delete({ where: { id: meeting.timeEntryId } });
    }
  });

  refresh();
}

// --------------------------------------------------------- client domains

const DOMAIN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

/**
 * Whatever people actually paste, reduced to bare domains: "@acme.com",
 * "www.acme.com", "someone@acme.com", a comma-separated list.
 */
function parseDomains(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\s,;]+/)
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean)
        .map((d) => d.replace(/^https?:\/\//, "").split("/")[0])
        .map((d) => (d.includes("@") ? d.slice(d.lastIndexOf("@") + 1) : d))
        .map((d) => d.replace(/^www\./, "")),
    ),
  ];
}

/** Attach one or more email domains to a client. */
export async function addClientDomainsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const clientId = String(formData.get("clientId") ?? "");
  const raw = String(formData.get("domains") ?? "");
  if (!clientId) return { error: "No client given." };

  const wanted = parseDomains(raw);

  if (wanted.length === 0) return { error: "Enter a domain, e.g. acme.com." };

  const bad = wanted.filter((d) => !DOMAIN.test(d));
  if (bad.length > 0) {
    return { error: `${bad.join(", ")} ${bad.length === 1 ? "isn't" : "aren't"} a domain.` };
  }

  // A domain can only mean one client, so say who has it rather than failing
  // on a unique constraint.
  const taken = await db.clientDomain.findMany({
    where: { domain: { in: wanted }, NOT: { clientId } },
    select: { domain: true, client: { select: { name: true } } },
  });
  if (taken.length > 0) {
    const list = taken.map((t) => `${t.domain} (${t.client.name})`).join(", ");
    return { error: `Already used by another client: ${list}.` };
  }

  await db.clientDomain.createMany({
    data: wanted.map((domain) => ({ clientId, domain })),
    skipDuplicates: true,
  });

  revalidatePath("/clients", "layout");
  return { ok: true };
}

export async function removeClientDomainAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.clientDomain.delete({ where: { id } }).catch(() => {});
  revalidatePath("/clients", "layout");
}

/**
 * Domains belonging to a partner.
 *
 * Deliberately allowed to overlap with a client's: Skaled is both the partner
 * work comes through and a customer in its own right, and the matcher wants to
 * know both facts.
 */
export async function addPartnerDomainsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const partnerId = String(formData.get("partnerId") ?? "");
  const wanted = parseDomains(String(formData.get("domains") ?? ""));
  if (!partnerId) return { error: "No partner given." };
  if (wanted.length === 0) return { error: "Enter a domain, e.g. outreach.io." };

  const bad = wanted.filter((d) => !DOMAIN.test(d));
  if (bad.length > 0) {
    return { error: `${bad.join(", ")} ${bad.length === 1 ? "isn't" : "aren't"} a domain.` };
  }

  const taken = await db.partnerDomain.findMany({
    where: { domain: { in: wanted }, NOT: { partnerId } },
    select: { domain: true, partner: { select: { name: true } } },
  });
  if (taken.length > 0) {
    const list = taken.map((t) => `${t.domain} (${t.partner.name})`).join(", ");
    return { error: `Already used by another partner: ${list}.` };
  }

  await db.partnerDomain.createMany({
    data: wanted.map((domain) => ({ partnerId, domain })),
    skipDuplicates: true,
  });

  revalidatePath("/clients", "layout");
  return { ok: true };
}

export async function removePartnerDomainAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.partnerDomain.delete({ where: { id } }).catch(() => {});
  revalidatePath("/clients", "layout");
}

// -------------------------------------------------------- ignored domains

/**
 * Domains to stop being reminded about.
 *
 * Meetings without a client in the room are never stored, so this doesn't
 * gate anything. What it does is keep a domain out of the "you could map
 * this" hint after the sync - the difference between a hint that names three
 * real prospects and one that names the same four dead ends every morning.
 */
export async function addIgnoredDomainsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const wanted = parseDomains(String(formData.get("domains") ?? ""));
  const note = String(formData.get("note") ?? "").trim() || null;
  if (wanted.length === 0) return { error: "Enter a domain, e.g. recruiters.com." };

  const bad = wanted.filter((d) => !DOMAIN.test(d));
  if (bad.length > 0) {
    return { error: `${bad.join(", ")} ${bad.length === 1 ? "isn't" : "aren't"} a domain.` };
  }

  // Ignoring a domain that identifies a client would quietly stop that
  // client's meetings appearing at all, which is a very confusing bug to
  // chase. Refuse rather than let it happen.
  const clash = await db.clientDomain.findMany({
    where: { domain: { in: wanted } },
    select: { domain: true, client: { select: { name: true } } },
  });
  if (clash.length > 0) {
    const list = clash.map((c) => `${c.domain} (${c.client.name})`).join(", ");
    return { error: `${list} identifies a client, so it's never in the hint anyway.` };
  }

  await db.ignoredDomain.createMany({
    data: wanted.map((domain) => ({ domain, note })),
    skipDuplicates: true,
  });

  revalidatePath("/clients", "layout");
  return { ok: true };
}

export async function removeIgnoredDomainAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.ignoredDomain.delete({ where: { id } }).catch(() => {});
  revalidatePath("/clients", "layout");
}

// ------------------------------------------------------------------ status

export interface GoogleStatus {
  configured: boolean;
  clientEmail: string | null;
  timezone: string;
  domains: number;
  clientsWithoutDomains: string[];
}

export async function googleStatus(): Promise<GoogleStatus> {
  const [domains, clients, timezone] = await Promise.all([
    db.clientDomain.count(),
    db.client.findMany({
      where: {
        archivedAt: null,
        domains: { none: {} },
        projects: { some: { status: { in: ["ACTIVE", "ON_HOLD"] } } },
      },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
    orgTimezone(),
  ]);

  return {
    configured: googleConfigured(),
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL ?? null,
    timezone,
    domains,
    clientsWithoutDomains: clients.map((c) => c.name),
  };
}
