import Link from "next/link";
import { isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium } from "@/lib/dates";
import { googleConfigured } from "@/lib/google/auth";
import { EmptyState, PageHeader } from "@/components/ui";
import { MailSyncButton } from "./MailSyncButton";

export const dynamic = "force-dynamic";

/** "2 hours ago", "yesterday" — how old a thread is is the urgency signal. */
function ago(date: Date): string {
  const mins = Math.round((Date.now() - date.getTime()) / 60_000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  return formatMedium(date);
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string; show?: string }>;
}) {
  const user = await requireUser();
  const admin = isAdmin(user);
  const params = await searchParams;
  const everyone = admin && params.who === "all";
  const showDone = params.show === "done";

  const threads = await db.mailThread.findMany({
    where: {
      ...(everyone ? {} : { userId: user.id }),
      status: showDone ? "DONE" : "OPEN",
    },
    orderBy: [{ awaitingUs: "desc" }, { lastMessageAt: "desc" }],
    take: 200,
    select: {
      id: true,
      subject: true,
      lastFrom: true,
      lastFromName: true,
      lastMessageAt: true,
      snippet: true,
      awaitingUs: true,
      confidence: true,
      client: { select: { name: true } },
      project: { select: { name: true } },
      user: { select: { name: true } },
      _count: { select: { messages: true } },
    },
  });

  if (!googleConfigured()) {
    return (
      <>
        <PageHeader title="Inbox" subtitle="Client email that needs an answer." />
        <EmptyState
          title="Google isn't connected yet"
          body="Once an admin adds the service account credentials in Railway, client email lands here as work to do."
        />
      </>
    );
  }

  const waiting = threads.filter((t) => t.awaitingUs).length;

  return (
    <>
      <PageHeader
        title="Inbox"
        subtitle={
          showDone
            ? "Threads you've dealt with."
            : waiting === 0
              ? "Client email that needs an answer."
              : `${waiting} thread${waiting === 1 ? "" : "s"} waiting on you.`
        }
        actions={<MailSyncButton admin={admin} />}
      />

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link
          href={everyone ? "/inbox?who=all" : "/inbox"}
          className={showDone ? "btn-ghost btn-sm" : "btn-secondary btn-sm"}
        >
          To answer
        </Link>
        <Link
          href={everyone ? "/inbox?who=all&show=done" : "/inbox?show=done"}
          className={showDone ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
        >
          Done
        </Link>
        {admin ? (
          <span className="ml-auto flex gap-2">
            <Link
              href={showDone ? "/inbox?show=done" : "/inbox"}
              className={everyone ? "btn-ghost btn-sm" : "btn-secondary btn-sm"}
            >
              Mine
            </Link>
            <Link
              href={showDone ? "/inbox?who=all&show=done" : "/inbox?who=all"}
              className={everyone ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
            >
              Everyone
            </Link>
          </span>
        ) : null}
      </div>

      {threads.length === 0 ? (
        <EmptyState
          title={showDone ? "Nothing here yet" : "Nothing waiting"}
          body={
            showDone
              ? "Threads you've replied to or marked done show up here."
              : "No client email is waiting on a reply. Sync if you're expecting something — only mail from domains mapped to a client is pulled in."
          }
        />
      ) : (
        <ul className="card divide-y divide-ink-100">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/inbox/${t.id}`}
                className="block px-4 py-3 transition-colors hover:bg-ink-50"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  {t.awaitingUs ? (
                    <span
                      aria-label="Waiting on a reply"
                      title="Waiting on a reply"
                      className="inline-block h-2 w-2 shrink-0 rounded-full bg-warn-500"
                    />
                  ) : (
                    <span className="inline-block h-2 w-2 shrink-0" />
                  )}
                  <span className="font-medium text-ink-900">{t.subject}</span>
                  <span className="text-xs text-ink-500">
                    {t.lastFromName || t.lastFrom}
                    {t._count.messages > 1 ? ` · ${t._count.messages} messages` : ""}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-ink-400 tnum">
                    {ago(t.lastMessageAt)}
                  </span>
                </div>

                <p className="mt-1 line-clamp-2 pl-4 text-sm text-ink-600">{t.snippet}</p>

                <div className="mt-1 flex flex-wrap items-center gap-2 pl-4 text-xs">
                  {t.client ? (
                    <span className="chip bg-ink-100 text-ink-700">{t.client.name}</span>
                  ) : null}
                  {t.project ? (
                    <span className="text-ink-500">{t.project.name}</span>
                  ) : (
                    <span className="text-warn-700">Not filed to a project</span>
                  )}
                  {everyone ? (
                    <span className="ml-auto text-ink-400">{t.user.name}</span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
