// Digest content. Pure functions over plain data, so what lands in Slack can be
// tested without a Slack workspace — the shape of these messages is the part
// that's easy to get wrong and hard to notice.

import { formatHours } from "@/lib/format";

export interface DigestTask {
  name: string;
  projectName: string;
  dueDate: Date | null;
  overdue: boolean;
}

export interface DigestProject {
  name: string;
  health: "ON_TRACK" | "AT_RISK" | "OFF_TRACK" | null;
  openTasks: number;
}

export interface DailyInput {
  firstName: string;
  /** True on Mondays, when the week ahead is worth showing, not just today. */
  weekAhead: boolean;
  overdue: DigestTask[];
  dueToday: DigestTask[];
  /** The rest of this week. Only shown on the week-ahead day. */
  dueLater: DigestTask[];
  ownedNeedingAttention: DigestProject[];
  /** Minutes logged on the last working day, and the label for that day. */
  lastWorkedMinutes: number;
  lastWorkedLabel: string;
  weekMinutes: number;
  appUrl: string;
}

export interface SlackMessage {
  text: string;
  blocks: unknown[];
}

const section = (text: string) => ({
  type: "section",
  text: { type: "mrkdwn", text },
});

const context = (text: string) => ({
  type: "context",
  elements: [{ type: "mrkdwn", text }],
});

const linkButton = (label: string, url: string) => ({
  type: "actions",
  elements: [
    { type: "button", text: { type: "plain_text", text: label }, url },
  ],
});

// Slack truncates long messages badly, and a brief nobody finishes reading is
// a brief nobody acts on. At 5am this needs to be scannable in ten seconds.
const MAX_LINES = 6;

function taskLines(tasks: DigestTask[], withDate = true): string {
  const shown = tasks.slice(0, MAX_LINES).map((t) => {
    if (!withDate || !t.dueDate) return `• ${t.name} — _${t.projectName}_`;
    const due = t.dueDate.toLocaleDateString("en-US", {
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    return `• ${t.name} — _${t.projectName}_ · ${due}`;
  });
  const rest = tasks.length - shown.length;
  if (rest > 0) shown.push(`• _…and ${rest} more_`);
  return shown.join("\n");
}

/**
 * The 5am brief. One message a day covering what's on your plate and whether
 * your time is up to date — the two things that go stale without a nudge.
 *
 * On Mondays it widens to the week ahead; the rest of the week it stays on
 * today, because a daily message repeating the same seven tasks stops being
 * read by Wednesday.
 */
export function buildDailyDigest(input: DailyInput): SlackMessage {
  const {
    firstName, weekAhead, overdue, dueToday, dueLater,
    ownedNeedingAttention, lastWorkedMinutes, lastWorkedLabel,
    weekMinutes, appUrl,
  } = input;

  const blocks: unknown[] = [];

  const bits: string[] = [];
  if (overdue.length) bits.push(`${overdue.length} overdue`);
  if (dueToday.length) bits.push(`${dueToday.length} due today`);
  if (weekAhead && dueLater.length) bits.push(`${dueLater.length} later this week`);

  const headline =
    bits.length === 0
      ? `Morning ${firstName} — nothing due on your plate today.`
      : `Morning ${firstName} — ${bits.join(", ")}.`;

  blocks.push(section(`*${headline}*`));

  if (overdue.length > 0) {
    blocks.push(section(`:rotating_light: *Overdue*\n${taskLines(overdue)}`));
  }
  if (dueToday.length > 0) {
    blocks.push(section(`*Due today*\n${taskLines(dueToday, false)}`));
  }
  if (weekAhead && dueLater.length > 0) {
    blocks.push(section(`*Rest of the week*\n${taskLines(dueLater)}`));
  }

  if (ownedNeedingAttention.length > 0) {
    const lines = ownedNeedingAttention
      .slice(0, MAX_LINES)
      .map(
        (p) =>
          `• ${p.health === "OFF_TRACK" ? ":red_circle:" : ":large_yellow_circle:"} ${p.name} — ${p.openTasks} open`,
      )
      .join("\n");
    blocks.push(section(`*Your projects needing a look*\n${lines}`));
  }

  // Time, every day. This is the half that keeps the invoice honest.
  const timeLine =
    lastWorkedMinutes === 0
      ? `:hourglass: *Nothing logged ${lastWorkedLabel}.* ${formatHours(weekMinutes)}h this week so far.`
      : `:hourglass: ${formatHours(lastWorkedMinutes)}h logged ${lastWorkedLabel} · ${formatHours(weekMinutes)}h this week so far.`;
  blocks.push(section(timeLine));

  blocks.push(context("Log from here with `/onespace log 1.5 Acme kickoff call`."));
  blocks.push(linkButton("Open my work", appUrl));

  return { text: headline, blocks };
}

/** Posted to a project's channel when someone files a status update. */
export function buildStatusUpdateMessage({
  projectName,
  health,
  note,
  authorName,
  url,
}: {
  projectName: string;
  health: "ON_TRACK" | "AT_RISK" | "OFF_TRACK";
  note: string | null;
  authorName: string;
  url: string;
}): SlackMessage {
  const dot =
    health === "ON_TRACK"
      ? ":large_green_circle:"
      : health === "AT_RISK"
        ? ":large_yellow_circle:"
        : ":red_circle:";
  const label =
    health === "ON_TRACK" ? "On track" : health === "AT_RISK" ? "At risk" : "Off track";

  const text = `${dot} ${projectName} — ${label}`;
  const blocks: unknown[] = [
    section(`${dot} *${projectName}* — ${label}`),
    ...(note ? [section(note)] : []),
    context(`Posted by ${authorName} · <${url}|open the project>`),
  ];
  return { text, blocks };
}
