import Link from "next/link";
import { notFound } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatMedium, timeInZone } from "@/lib/dates";
import { orgTimezone } from "@/lib/google/sync";
import { reopenMailAction } from "@/app/actions/mail";
import { SubmitButton } from "@/components/SubmitButton";
import { FileToProject, type ProjectOption } from "./FileToProject";
import { ReplyBox } from "./ReplyBox";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const thread = await db.mailThread.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true } },
      client: { select: { name: true } },
      project: { select: { id: true, name: true } },
      messages: { orderBy: { sentAt: "asc" } },
    },
  });

  if (!thread) notFound();
  if (thread.userId !== user.id && !isAdmin(user)) notFound();

  const [zone, projects] = await Promise.all([
    orgTimezone(),
    db.project.findMany({
      where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
      orderBy: [{ client: { name: "asc" } }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        client: { select: { name: true } },
        tasks: {
          where: { status: { not: "DONE" } },
          orderBy: { orderIndex: "asc" },
          select: { id: true, name: true },
        },
      },
    }),
  ]);

  const options: ProjectOption[] = projects.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.client?.name ?? null,
    tasks: p.tasks,
  }));

  // An admin reading someone else's thread can file it, but replying would
  // send mail from that person's address as if they'd written it.
  const mine = thread.userId === user.id;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/inbox" className="text-sm text-ink-500 hover:text-ink-800">
        ← Inbox
      </Link>

      <div className="mt-2 mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">
            {thread.subject}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {thread.client?.name ?? "Unknown client"}
            {thread.messages.length > 1 ? ` · ${thread.messages.length} messages` : ""}
            {!mine ? ` · ${thread.user.name}'s mailbox` : ""}
          </p>
        </div>

        {thread.status === "DONE" ? (
          <form action={reopenMailAction}>
            <input type="hidden" name="id" value={thread.id} />
            <SubmitButton pendingLabel="…" className="btn-secondary btn-sm">
              Reopen
            </SubmitButton>
          </form>
        ) : thread.awaitingUs ? (
          <span className="chip bg-warn-50 text-warn-700">Waiting on a reply</span>
        ) : (
          <span className="chip bg-ink-100 text-ink-600">You replied last</span>
        )}
      </div>

      <FileToProject
        threadId={thread.id}
        projects={options}
        projectId={thread.projectId}
        taskId={thread.taskId}
        reason={thread.matchReason}
      />

      <ol className="mt-4 grid gap-3">
        {thread.messages.map((m) => (
          <li
            key={m.id}
            className={`card p-4 ${m.fromUs ? "border-brand-200 bg-brand-50/40" : ""}`}
          >
            <div className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="font-medium text-ink-900">
                {m.fromName || m.fromEmail}
              </span>
              <span className="text-xs text-ink-500">{m.fromEmail}</span>
              {m.sentFromOneSpace ? (
                <span className="chip bg-ink-100 text-ink-600">sent from OneSpace</span>
              ) : null}
              <span className="ml-auto text-xs text-ink-400 tnum">
                {formatMedium(m.sentAt)} · {timeInZone(m.sentAt, zone)}
              </span>
            </div>

            {m.toEmails.length > 0 ? (
              <p className="mt-0.5 truncate text-xs text-ink-400">
                to {m.toEmails.join(", ")}
                {m.ccEmails.length > 0 ? ` · cc ${m.ccEmails.join(", ")}` : ""}
              </p>
            ) : null}

            {/* Plain text, converted from HTML on the way in — whitespace is
                all the formatting there is, and all it needs. */}
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-800">
              {m.body || <span className="text-ink-400">(no text in this message)</span>}
            </p>
          </li>
        ))}
      </ol>

      {mine ? (
        <ReplyBox
          threadId={thread.id}
          canLogTime={Boolean(thread.projectId)}
          projectName={thread.project?.name ?? null}
        />
      ) : (
        <p className="mt-4 text-sm text-ink-500">
          Only {thread.user.name} can reply from here — sending would go out from their
          address.
        </p>
      )}
    </div>
  );
}
