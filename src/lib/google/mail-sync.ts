import "server-only";
import { db } from "@/lib/db";
import { dayStart } from "@/lib/dates";
import { findThreadIds, getThread, type GmailMessage } from "@/lib/google/gmail";
import { GoogleApiError, GoogleAuthError, googleConfigured } from "@/lib/google/auth";
import { buildWeights, matchMeeting, type MatchCandidate } from "@/lib/google/match";

export const MAIL_FROM_KEY = "google.mailFrom";
export const DEFAULT_MAIL_FROM = "2026-08-01";

export async function mailSyncFrom(): Promise<Date> {
  const row = await db.appSetting.findUnique({ where: { key: MAIL_FROM_KEY } });
  return dayStart(row?.value || DEFAULT_MAIL_FROM);
}

export interface MailSyncOutcome {
  people: number;
  threads: number;
  created: number;
  updated: number;
  /** Threads whose newest message is theirs - the ones that need answering. */
  awaiting: number;
  failed: { name: string; error: string }[];
}

/** The same candidate list the meeting matcher uses. */
async function loadCandidates(): Promise<MatchCandidate[]> {
  const projects = await db.project.findMany({
    where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
    select: {
      id: true,
      name: true,
      ownerId: true,
      client: {
        select: { id: true, name: true, domains: { select: { domain: true } } },
      },
      tasks: {
        where: { status: { not: "DONE" } },
        select: { id: true, name: true },
      },
    },
  });

  return projects.map((p) => ({
    projectId: p.id,
    projectName: p.name,
    clientId: p.client?.id ?? null,
    clientName: p.client?.name ?? null,
    domains: p.client?.domains.map((d) => d.domain) ?? [],
    tasks: p.tasks,
    ownerId: p.ownerId,
  }));
}

/**
 * Pull client mail and turn unanswered threads into work.
 *
 * Only threads touching a mapped client domain are fetched at all. A mailbox
 * with no matching mail is one Gmail is asked a single question about and
 * nothing more.
 */
export async function syncMail(options?: {
  userId?: string;
  from?: Date;
  /** Threads per person per run. */
  limit?: number;
}): Promise<MailSyncOutcome> {
  const outcome: MailSyncOutcome = {
    people: 0,
    threads: 0,
    created: 0,
    updated: 0,
    awaiting: 0,
    failed: [],
  };

  if (!googleConfigured()) {
    throw new Error("Google isn't connected yet - add the service account credentials in Railway.");
  }

  const domainRows = await db.clientDomain.findMany({
    select: { domain: true, clientId: true },
  });
  if (domainRows.length === 0) return outcome;

  const clientByDomain = new Map(domainRows.map((d) => [d.domain, d.clientId]));
  const domains = domainRows.map((d) => d.domain);

  const people = await db.user.findMany({
    where: { isActive: true, ...(options?.userId ? { id: options.userId } : {}) },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  if (people.length === 0) return outcome;

  const allUsers = await db.user.findMany({ select: { email: true } });
  const ourDomains = new Set(
    allUsers
      .map((u) => u.email.split("@")[1]?.toLowerCase())
      .filter((d): d is string => Boolean(d)),
  );

  const candidates = await loadCandidates();
  const weights = buildWeights(candidates);
  // Domains that belong to a partner rather than a customer, so a partner
  // sitting in on a client call doesn't read as a second client.
  const partnerDomains = new Map(
    (
      await db.partnerDomain.findMany({
        select: { domain: true, partner: { select: { name: true } } },
      })
    ).map((d) => [d.domain, d.partner.name]),
  );
  const from = options?.from ?? (await mailSyncFrom());
  const limit = options?.limit ?? 150;

  for (const person of people) {
    let threadIds: string[];
    try {
      threadIds = await findThreadIds(person.email, domains, from, limit);
    } catch (e) {
      outcome.failed.push({ name: person.name, error: describe(e) });
      continue;
    }
    outcome.people += 1;

    for (const threadId of threadIds) {
      let thread;
      try {
        thread = await getThread(person.email, threadId);
      } catch {
        // One unreadable thread shouldn't cost the rest of the mailbox.
        continue;
      }
      if (!thread) continue;

      const messages = thread.messages;
      const newest = messages[messages.length - 1];

      // Which client this is. Taken across the whole thread, because the
      // newest message is often ours and would otherwise identify nobody.
      const involved = new Set<string>();
      for (const m of messages) {
        for (const address of [m.fromEmail, ...m.toEmails, ...m.ccEmails]) {
          const d = address.split("@")[1]?.toLowerCase();
          if (d && clientByDomain.has(d)) involved.add(d);
        }
      }
      if (involved.size === 0) continue;

      const externalDomains = [...involved];
      const clientIds = new Set(externalDomains.map((d) => clientByDomain.get(d)!));

      const match = matchMeeting(
        {
          title: newest.subject,
          externalDomains,
          organizerEmail: newest.fromEmail,
          userId: person.id,
        },
        candidates,
        weights,
        partnerDomains,
      );

      const fromUs = (address: string) => {
        const d = address.split("@")[1]?.toLowerCase();
        return Boolean(d && ourDomains.has(d));
      };

      // The question the inbox exists to answer: did they speak last?
      const awaitingUs = !fromUs(newest.fromEmail);
      if (awaitingUs) outcome.awaiting += 1;

      const existing = await db.mailThread.findUnique({
        where: {
          userId_gmailThreadId: { userId: person.id, gmailThreadId: thread.gmailThreadId },
        },
        select: { id: true, status: true, lastMessageAt: true, projectId: true, taskId: true },
      });

      // A thread marked done reopens only when the client says something new.
      // Our own reply must not reopen it, and neither must a re-sync.
      const reopened =
        existing?.status === "DONE" &&
        awaitingUs &&
        newest.sentAt.getTime() > existing.lastMessageAt.getTime();

      const data = {
        clientId: clientIds.size === 1 ? [...clientIds][0] : (match.clientId ?? null),
        subject: newest.subject,
        lastFrom: newest.fromEmail,
        lastFromName: newest.fromName,
        lastMessageAt: newest.sentAt,
        snippet: newest.body.slice(0, 300),
        awaitingUs,
        matchReason: match.reason,
        confidence: match.confidence,
        syncedAt: new Date(),
      };

      let rowId: string;
      if (existing) {
        const updated = await db.mailThread.update({
          where: { id: existing.id },
          data: {
            ...data,
            ...(reopened ? { status: "OPEN" as const } : {}),
            // Never overwrite a filing someone made by hand.
            ...(existing.projectId ? {} : { projectId: match.projectId, taskId: match.taskId }),
          },
        });
        rowId = updated.id;
        outcome.updated += 1;
      } else {
        const created = await db.mailThread.create({
          data: {
            userId: person.id,
            gmailThreadId: thread.gmailThreadId,
            projectId: match.projectId,
            taskId: match.taskId,
            ...data,
          },
        });
        rowId = created.id;
        outcome.created += 1;
      }

      await saveMessages(rowId, messages, fromUs);
      outcome.threads += 1;
    }
  }

  return outcome;
}

async function saveMessages(
  threadId: string,
  messages: GmailMessage[],
  fromUs: (address: string) => boolean,
) {
  // createMany with skipDuplicates rather than one upsert per message: a long
  // thread is fifty rows, forty-nine of which are already there and none of
  // which ever change once sent.
  await db.mailMessage.createMany({
    data: messages.map((m) => ({
      threadId,
      gmailMessageId: m.gmailMessageId,
      fromEmail: m.fromEmail,
      fromName: m.fromName,
      toEmails: m.toEmails,
      ccEmails: m.ccEmails,
      sentAt: m.sentAt,
      // Trimmed: quoted history repeats the whole thread in every reply, and
      // the thread is already here message by message.
      body: trimQuoted(m.body).slice(0, 20_000),
      messageIdHeader: m.messageId,
      referencesHeader: m.references,
      fromUs: fromUs(m.fromEmail),
    })),
    skipDuplicates: true,
  });
}

/**
 * Drop the quoted copy of everything said before.
 *
 * Every reply carries the whole conversation again, so without this a
 * ten-message thread stores the first message ten times and reads as a wall.
 */
export function trimQuoted(body: string): string {
  const lines = body.split("\n");
  const cut = lines.findIndex((line) =>
    /^\s*On .+ wrote:\s*$/.test(line) ||
    /^\s*-{2,}\s*Original Message\s*-{2,}/i.test(line) ||
    /^\s*_{10,}\s*$/.test(line) ||
    /^\s*From:\s.+@/.test(line),
  );
  const kept = cut > 0 ? lines.slice(0, cut) : lines;
  return kept
    .filter((line) => !line.trimStart().startsWith(">"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function describe(e: unknown): string {
  if (e instanceof GoogleAuthError) return e.message;
  if (e instanceof GoogleApiError) {
    if (e.status === 403) {
      return `${e.message} (the Gmail scope may be missing from the delegation grant)`;
    }
    return e.message;
  }
  return e instanceof Error ? e.message : String(e);
}
