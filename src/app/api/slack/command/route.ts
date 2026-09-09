import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dayStart, today } from "@/lib/dates";
import { formatHours } from "@/lib/format";
import { assertUnlocked } from "@/lib/lock";
import { resolveRates } from "@/lib/rates";
import { matchCandidate, parseCommand } from "@/lib/slack/command";
import { verifySlackRequest } from "@/lib/slack/verify";
import { appUrl } from "@/lib/slack/send";

export const dynamic = "force-dynamic";

// `/onespace` — log time and check your plate without leaving Slack.
//
// Everything here replies ephemerally: a slash command is a private aside, and
// nobody wants their timesheet corrections in the channel.

const ephemeral = (text: string) =>
  NextResponse.json({ response_type: "ephemeral", text });

const HELP = [
  "*`/onespace` — what I can do*",
  "",
  "`/onespace log 1.5 Acme kickoff` — log 1.5 hours against the project that best matches, today",
  "`/onespace log 45m LI-COR prompt testing` — durations can be `1.5`, `1:30` or `90m`",
  "`/onespace today` — your open tasks and what you've logged so far today",
  "",
  `Everything else lives at ${appUrl()}.`,
].join("\n");

export async function POST(request: Request) {
  // The signature is over the raw bytes, so read the body as text once and
  // parse it ourselves rather than letting the framework re-serialise it.
  const raw = await request.text();

  const check = verifySlackRequest({
    body: raw,
    signature: request.headers.get("x-slack-signature"),
    timestamp: request.headers.get("x-slack-request-timestamp"),
  });
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 401 });
  }

  const form = new URLSearchParams(raw);
  const slackUserId = form.get("user_id") ?? "";
  const text = form.get("text") ?? "";

  const user = slackUserId
    ? await db.user.findUnique({
        where: { slackUserId },
        select: { id: true, name: true, isActive: true },
      })
    : null;

  if (!user || !user.isActive) {
    return ephemeral(
      "I can't match your Slack account to anyone in OneSpace. Ask Brianna to " +
        "run *Link Slack accounts* on the People page.",
    );
  }

  const cmd = parseCommand(text);

  if (cmd.kind === "help") return ephemeral(HELP);
  if (cmd.kind === "error") return ephemeral(cmd.message);
  if (cmd.kind === "today") return ephemeral(await todayFor(user.id));

  // ------------------------------------------------------------------ log
  const selectProject = {
    id: true,
    name: true,
    client: { select: { name: true } },
  } as const;

  const mine = await db.project.findMany({
    where: {
      status: { in: ["ACTIVE", "ON_HOLD"] },
      OR: [{ ownerId: user.id }, { tasks: { some: { assigneeId: user.id } } }],
    },
    select: selectProject,
  });

  const toCandidates = (rows: typeof mine) =>
    rows.map((p) => ({ id: p.id, name: p.name, aka: p.client?.name ?? null }));

  // Your own projects get first refusal, so a vague word lands on the work you
  // actually do. Failing that, widen to everything open — the hour you spent
  // helping on someone else's project still has to go somewhere.
  let match = matchCandidate(cmd.text, toCandidates(mine));
  if (!match.best && match.tied.length === 0) {
    const all = await db.project.findMany({
      where: { status: { in: ["ACTIVE", "ON_HOLD"] } },
      select: selectProject,
    });
    match = matchCandidate(cmd.text, toCandidates(all));
  }

  if (match.tied.length > 1) {
    return ephemeral(
      `That could be either of these — say a bit more:\n${match.tied
        .map((t) => `• ${t.name}`)
        .join("\n")}`,
    );
  }
  if (!match.best) {
    return ephemeral(
      `I couldn't find a project matching “${cmd.text}”. ` +
        `Log it at ${appUrl()}/timesheet, or try part of the client's name.`,
    );
  }

  // A task match is a bonus. When there isn't one the text becomes the note, so
  // what the time was for is never lost.
  const tasks = await db.task.findMany({
    where: { projectId: match.best.id, status: { not: "DONE" } },
    select: { id: true, name: true },
  });
  const taskMatch =
    match.leftover.length > 0
      ? matchCandidate(match.leftover.join(" "), tasks)
      : { best: null, tied: [], leftover: [] };

  const date = dayStart(today());
  try {
    await assertUnlocked(date);
  } catch (e) {
    return ephemeral(e instanceof Error ? e.message : "That period is closed.");
  }

  const rates = await resolveRates(user.id, match.best.id);
  await db.timeEntry.create({
    data: {
      userId: user.id,
      projectId: match.best.id,
      taskId: taskMatch.best?.id ?? null,
      date,
      minutes: cmd.minutes,
      notes: taskMatch.best ? null : cmd.text,
      source: "MANUAL",
      ...rates,
    },
  });

  const where = taskMatch.best
    ? `*${match.best.name}* → ${taskMatch.best.name}`
    : `*${match.best.name}*`;
  const billing = rates.billable ? "" : " _(non-billable)_";

  return ephemeral(
    `Logged *${formatHours(cmd.minutes)}h* to ${where} for today.${billing}\n` +
      `<${appUrl()}/timesheet|Open your timesheet>`,
  );
}

async function todayFor(userId: string): Promise<string> {
  const now = dayStart(today());

  const [entries, tasks] = await Promise.all([
    db.timeEntry.findMany({
      where: { userId, date: now },
      select: { minutes: true, project: { select: { name: true } } },
    }),
    db.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: "DONE" },
        project: { status: { in: ["ACTIVE", "ON_HOLD"] } },
        dueDate: { not: null, lte: now },
      },
      select: { name: true, dueDate: true, project: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),
  ]);

  const logged = entries.reduce((sum, e) => sum + e.minutes, 0);
  const lines: string[] = [];

  lines.push(
    logged === 0
      ? "*Nothing logged today yet.*"
      : `*${formatHours(logged)}h logged today.*`,
  );
  if (entries.length > 0) {
    const byProject = new Map<string, number>();
    for (const e of entries) {
      byProject.set(
        e.project.name,
        (byProject.get(e.project.name) ?? 0) + e.minutes,
      );
    }
    lines.push(
      [...byProject.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([name, m]) => `• ${formatHours(m)}h — ${name}`)
        .join("\n"),
    );
  }

  if (tasks.length > 0) {
    lines.push("");
    lines.push(`*Due or overdue (${tasks.length})*`);
    lines.push(tasks.map((t) => `• ${t.name} — _${t.project.name}_`).join("\n"));
  }

  return lines.join("\n");
}
