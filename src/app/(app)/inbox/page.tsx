import Link from "next/link";
import { isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium } from "@/lib/dates";
import { googleConfigured } from "@/lib/google/auth";
import {
  asReplyFilter,
  attributeRows,
  filterLabel,
  filterOptions,
  inboxHref,
  replyWhere,
  whichWhere,
  type ReplyFilter,
} from "@/lib/inbox-filters";
import { EmptyState, PageHeader } from "@/components/ui";
import { MailSyncButton } from "./MailSyncButton";
import { ProjectFilter, ReplyFilterTabs } from "./InboxFilters";

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
  searchParams: Promise<{
    who?: string;
    show?: string;
    which?: string;
    reply?: string;
  }>;
}) {
  const user = await requireUser();
  const admin = isAdmin(user);
  const params = await searchParams;
  const everyone = admin && params.who === "all";
  const showDone = params.show === "done";
  const reply = asReplyFilter(params.reply);
  const which = params.which;

  // Everything in the tab the person is looking at. The dropdown and the
  // reply tabs are both built from this, so neither one hides choices the
  // other would have offered.
  const scope = {
    ...(everyone ? {} : { userId: user.id }),
    status: (showDone ? "DONE" : "OPEN") as "DONE" | "OPEN",
  };

  const current = {
    who: params.who,
    show: params.show,
    which,
    reply: params.reply,
  };

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

  const [grouped, byReply] = await Promise.all([
    db.mailThread.groupBy({
      by: ["clientId", "projectId"],
      where: scope,
      _count: { _all: true },
    }),
    db.mailThread.groupBy({
      by: ["awaitingUs"],
      where: scope,
      _count: { _all: true },
    }),
  ]);

  const projectIds = [
    ...new Set(grouped.map((g) => g.projectId).filter((id): id is string => Boolean(id))),
  ];
  const projects = projectIds.length
    ? await db.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, name: true, clientId: true },
      })
    : [];

  const rows = attributeRows(
    grouped.map((g) => ({
      clientId: g.clientId,
      projectId: g.projectId,
      count: g._count._all,
    })),
    new Map(projects.map((p) => [p.id, p.clientId])),
  );

  const clientIds = [
    ...new Set(rows.map((r) => r.clientId).filter((id): id is string => Boolean(id))),
  ];
  const clients = clientIds.length
    ? await db.client.findMany({
        where: { id: { in: clientIds } },
        select: { id: true, name: true },
      })
    : [];

  const groups = filterOptions(rows, {
    clients: new Map(clients.map((c) => [c.id, c.name])),
    projects: new Map(projects.map((p) => [p.id, p.name])),
  });

  const waitingCount =
    byReply.find((r) => r.awaitingUs)?._count._all ?? 0;
  const repliedCount =
    byReply.find((r) => !r.awaitingUs)?._count._all ?? 0;
  const replyCounts: Record<ReplyFilter, number> = {
    all: waitingCount + repliedCount,
    waiting: waitingCount,
    replied: repliedCount,
  };

  const threads = await db.mailThread.findMany({
    where: { ...scope, ...whichWhere(which), ...replyWhere(reply) },
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

  const filtered = Boolean(which) || reply !== "all";
  const whichLabel = filterLabel(groups, which);

  return (
    <>
      <PageHeader
        title="Inbox"
        subtitle={
          showDone
            ? "Threads you've dealt with."
            : waitingCount === 0
              ? "Client email that needs an answer."
              : `${waitingCount} thread${waitingCount === 1 ? "" : "s"} waiting on you.`
        }
        actions={<MailSyncButton admin={admin} />}
      />

      <div className="mb-3 flex flex-wrap gap-2 text-sm">
        <Link
          href={inboxHref(current, { show: null })}
          className={showDone ? "btn-ghost btn-sm" : "btn-secondary btn-sm"}
        >
          To answer
        </Link>
        <Link
          href={inboxHref(current, { show: "done" })}
          className={showDone ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
        >
          Done
        </Link>
        {admin ? (
          <span className="ml-auto flex gap-2">
            <Link
              href={inboxHref(current, { who: null })}
              className={everyone ? "btn-ghost btn-sm" : "btn-secondary btn-sm"}
            >
              Mine
            </Link>
            <Link
              href={inboxHref(current, { who: "all" })}
              className={everyone ? "btn-secondary btn-sm" : "btn-ghost btn-sm"}
            >
              Everyone
            </Link>
          </span>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <ProjectFilter groups={groups} current={current} />
        <ReplyFilterTabs current={current} counts={replyCounts} />
        {filtered ? (
          <Link
            href={inboxHref(current, { which: null, reply: null })}
            className="text-xs text-ink-500 underline decoration-ink-300 hover:text-ink-800"
          >
            Clear
          </Link>
        ) : null}
      </div>

      {filtered && threads.length > 0 ? (
        <p className="mb-2 text-xs text-ink-500">
          {threads.length} of {replyCounts.all}
          {whichLabel ? ` · ${whichLabel}` : ""}
        </p>
      ) : null}

      {threads.length === 0 ? (
        <EmptyState
          title={
            filtered
              ? "Nothing matches that"
              : showDone
                ? "Nothing here yet"
                : "Nothing waiting"
          }
          body={
            filtered
              ? "No thread in this tab matches the client and reply state you picked. Clear the filters to see the rest."
              : showDone
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
                      aria-hidden="true"
                      className="inline-block h-2 w-2 shrink-0 rounded-full bg-warn-500"
                    />
                  ) : (
                    <span aria-hidden="true" className="inline-block h-2 w-2 shrink-0" />
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
                  {t.awaitingUs ? (
                    <span className="chip bg-warn-50 text-warn-700">
                      Waiting on you
                    </span>
                  ) : (
                    <span className="chip bg-ink-100 text-ink-600">
                      You replied last
                    </span>
                  )}
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
