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

export interface MondayInput {
  firstName: string;
  overdue: DigestTask[];
  dueThisWeek: DigestTask[];
  ownedNeedingAttention: DigestProject[];
  appUrl: string;
}

export interface FridayInput {
  firstName: string;
  byProject: { name: string; minutes: number }[];
  totalMinutes: number;
  /** Days this week with nothing logged at all, as short labels ("Tue"). */
  emptyDays: string[];
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

// Slack truncates long messages badly, and a digest nobody finishes reading is
// a digest nobody acts on.
const MAX_LINES = 8;

function taskLines(tasks: DigestTask[]): string {
  const shown = tasks.slice(0, MAX_LINES).map((t) => {
    const due = t.dueDate
      ? t.dueDate.toLocaleDateString("en-US", {
          timeZone: "UTC",
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      : "no date";
    return `• ${t.name} — _${t.projectName}_ · ${due}`;
  });
  const rest = tasks.length - shown.length;
  if (rest > 0) shown.push(`• _…and ${rest} more_`);
  return shown.join("\n");
}

export function buildMondayDigest(input: MondayInput): SlackMessage {
  const { firstName, overdue, dueThisWeek, ownedNeedingAttention, appUrl } = input;
  const blocks: unknown[] = [];

  const total = overdue.length + dueThisWeek.length;
  const headline =
    total === 0
      ? `Morning ${firstName} — nothing is due on your plate this week.`
      : `Morning ${firstName} — ${total} ${total === 1 ? "task" : "tasks"} on your plate this week.`;

  blocks.push(section(`*${headline}*`));

  if (overdue.length > 0) {
    blocks.push(
      section(
        `:rotating_light: *Overdue (${overdue.length})*\n${taskLines(overdue)}`,
      ),
    );
  }
  if (dueThisWeek.length > 0) {
    blocks.push(
      section(`*Due this week (${dueThisWeek.length})*\n${taskLines(dueThisWeek)}`),
    );
  }

  if (ownedNeedingAttention.length > 0) {
    const lines = ownedNeedingAttention
      .slice(0, MAX_LINES)
      .map(
        (p) =>
          `• ${p.health === "OFF_TRACK" ? ":red_circle:" : ":large_yellow_circle:"} ${p.name} — ${p.openTasks} open`,
      )
      .join("\n");
    blocks.push(section(`*Projects you own that need a look*\n${lines}`));
  }

  blocks.push(linkButton("Open my work", appUrl));

  return { text: headline, blocks };
}

export function buildFridayDigest(input: FridayInput): SlackMessage {
  const { firstName, byProject, totalMinutes, emptyDays, appUrl } = input;
  const blocks: unknown[] = [];

  const hours = formatHours(totalMinutes);
  const headline =
    totalMinutes === 0
      ? `${firstName}, there's no time logged against your name this week.`
      : `${firstName}, you've logged ${hours}h this week.`;

  blocks.push(section(`*${headline}*`));

  if (byProject.length > 0) {
    const lines = byProject
      .slice(0, MAX_LINES)
      .map((p) => `• ${formatHours(p.minutes)}h — ${p.name}`);
    const rest = byProject.length - lines.length;
    if (rest > 0) lines.push(`• _…and ${rest} more_`);
    blocks.push(section(lines.join("\n")));
  }

  if (emptyDays.length > 0) {
    blocks.push(
      context(
        `:calendar: Nothing logged on ${emptyDays.join(", ")}. Worth a look before the month closes.`,
      ),
    );
  }

  blocks.push(
    context("Log from here with `/onespace log 1.5 Acme kickoff call`."),
  );
  blocks.push(linkButton("Open my timesheet", `${appUrl}/timesheet`));

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
