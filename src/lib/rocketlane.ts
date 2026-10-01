/**
 * The RocketLane weekly update, rendered from what OneSpace knows.
 *
 * RevOptics files one of these per project per week against a fixed template.
 * The template's own bracketed prompts are kept for anything OneSpace can't
 * answer, so an unfilled field reads as a question rather than disappearing —
 * a blank that vanishes can never be noticed as missing, and these updates go
 * to the customer.
 *
 * Plain module, no database: the formatting, the week window and the gap
 * arithmetic are the parts worth testing, and tests can't import anything
 * server-only.
 */

export type Rag = "ON_TRACK" | "AT_RISK" | "OFF_TRACK";

/** OneSpace says On track; RocketLane says Green. Same fact, two vocabularies. */
export const RAG_LABEL: Record<Rag, string> = {
  ON_TRACK: "Green",
  AT_RISK: "Amber",
  OFF_TRACK: "Red",
};

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Completed",
};

/** The template's own prompts, kept verbatim for fields nobody has filled. */
const PROMPT = {
  useCases: "[1–2 sentence description of the use case(s) this engagement covers.]",
  kpis: "[Named metrics and how they'll be measured; note the baseline source and first checkpoint date.]",
  amplifyStatus: "[In Configuration / In Evaluation / Post-Eval Support]",
  amplifyProduct:
    "[Agents/products in scope, e.g., Research Agent, Personalization Agent, Engage sequence.]",
  amplifyDataProvider: "[Data provider(s) in scope, if any.]",
  amplifyCompetitor: '[Named competitor tool in play, or "None."]',
  ragReasons: "[Why — tie back to the RAG definitions.]",
  date: "[TBD]",
  currentStatus: "[What's true right now, in plain language.]",
  painPoints: "[Open blockers, named.]",
  risk: "[What could slip the timeline or outcome, and why.]",
  nextSteps: "[Numbered list, each with an owner.]",
  customerQuotes: "[Verbatim quote — source and date.]",
  baselineMetrics: "[Pre-engagement baseline, if applicable.]",
  projectMetrics: '[Results to date, or "Pre-launch — no results yet."]',
} as const;

// ----------------------------------------------------------------- the week

/**
 * The seven days ending on a Thursday — Friday through Thursday.
 *
 * The report is filed Thursday morning and covers the week since the last
 * one. Asked on any other day it still answers about the most recent
 * Thursday, so Wednesday's dry run and Thursday's real one agree.
 */
export function weekEndingThursday(now: Date): { from: Date; to: Date } {
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  // 4 is Thursday. Walk back to it; a Thursday stays put.
  const back = (to.getUTCDay() - 4 + 7) % 7;
  to.setUTCDate(to.getUTCDate() - back);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 6);
  return { from, to };
}

// ------------------------------------------------------------------- inputs

/**
 * One call in the week, and whatever is known about what was said on it.
 *
 * The transcript itself is never kept — `summary` is the write-up that
 * replaces it, and `note` says why there isn't one when there isn't. "Nobody
 * recorded this" and "Zoom refused the download" look identical from a
 * meeting list and only one is worth chasing.
 */
export interface MeetingNote {
  title: string;
  date: Date;
  minutes: number;
  recorded: boolean;
  summary: string | null;
  note: string | null;
}

/** Something somebody promised on a call, lifted out of the transcript. */
export interface CommitmentNote {
  task: string;
  speaker: string | null;
  dueDate: Date | null;
  /** True when the date came from the words, not from a three-day fallback. */
  dueStated: boolean;
}

/** What OneSpace saw happen on a project during the week, with nobody typing. */
export interface Activity {
  minutes: number;
  /** Who logged that time, most hours first. */
  people: string[];
  tasksCompleted: string[];
  tasksDueNext: string[];
  tasksOverdue: string[];
  meetings: MeetingNote[];
  commitments: CommitmentNote[];
}

export interface ReportProject {
  name: string;
  clientName: string | null;
  status: string;
  ownerName: string | null;
  useCases: string | null;
  kpis: string | null;
  isAmplify: boolean;
  amplifyStatus: string | null;
  amplifyProduct: string | null;
  amplifyDataProvider: string | null;
  amplifyCompetitor: string | null;
  evaluationStartDate: Date | null;
  evaluationDueDate: Date | null;
}

export interface ReportUpdate {
  health: Rag;
  date: Date;
  authorName: string | null;
  note: string | null;
  ragReasons: string | null;
  painPoints: string | null;
  risk: string | null;
  nextSteps: string | null;
  customerQuotes: string | null;
  baselineMetrics: string | null;
  projectMetrics: string | null;
}

// --------------------------------------------------------------------- gaps

export interface Gap {
  /** Nobody posted an update inside the week the report covers. */
  missing: boolean;
  /** Days from the last update of any age to the end of the week. */
  daysSince: number | null;
}

export function gapOf(
  lastUpdate: Date | null,
  week: { from: Date; to: Date },
): Gap {
  if (!lastUpdate) return { missing: true, daysSince: null };
  const day = 86_400_000;
  return {
    missing: lastUpdate < week.from,
    daysSince: Math.max(
      0,
      Math.round((week.to.getTime() - lastUpdate.getTime()) / day),
    ),
  };
}

/** "12 days ago", "today", "never". For the gap column. */
export function gapLabel(gap: Gap): string {
  if (gap.daysSince === null) return "Never updated";
  if (gap.daysSince === 0) return "Updated today";
  if (gap.daysSince === 1) return "Updated yesterday";
  return `Updated ${gap.daysSince} days ago`;
}

// ------------------------------------------------------------------- drafts

/**
 * What to write when nobody wrote anything.
 *
 * Only facts OneSpace watched happen - hours, finished tasks, meetings. It
 * is a draft to correct, never an update to file: a week of logged time says
 * what was done, not whether it went well, and the RAG status is a judgement
 * no amount of activity can make for you.
 */
export function draftFromActivity(a: Activity): string {
  const bits: string[] = [];

  if (a.minutes > 0) {
    const hours = Math.round((a.minutes / 60) * 4) / 4;
    const who = a.people.length ? ` by ${andList(a.people)}` : "";
    bits.push(`${hours} ${hours === 1 ? "hour" : "hours"} logged${who}.`);
  }
  if (a.meetings.length > 0) {
    const n = a.meetings.length;
    // Named, not counted. "3 meetings held" is a number; "kickoff, config
    // check-in and UAT review" is the week.
    bits.push(
      `${n} ${n === 1 ? "meeting" : "meetings"}: ${andList(
        a.meetings.map((m) => m.title),
      )}.`,
    );
  }
  if (a.tasksCompleted.length) {
    bits.push(`Completed: ${andList(a.tasksCompleted)}.`);
  }
  if (a.tasksOverdue.length) {
    bits.push(`Now overdue: ${andList(a.tasksOverdue)}.`);
  }

  if (!bits.length) {
    return "No time logged, no tasks closed and no meetings held this week.";
  }
  return bits.join(" ");
}

/**
 * Open work, as the numbered list the template asks for.
 *
 * What was promised on a call comes before what a task board says is due.
 * A commitment has a person attached and was made out loud to the customer,
 * which is both a better next step and the one they will remember.
 */
export function draftNextSteps(a: Activity, owner: string | null): string | null {
  const lines: string[] = [];

  for (const c of a.commitments) {
    const who = c.speaker ?? owner;
    // An invented due date reads as a question, not as a date anyone agreed
    // to, so only a stated one is printed.
    const when = c.dueDate && c.dueStated ? `, by ${isoDay(c.dueDate)}` : "";
    lines.push(`${c.task}${who ? ` — ${who}` : ""}${when}`);
  }

  for (const t of a.tasksDueNext) {
    if (lines.some((l) => l.startsWith(t))) continue;
    lines.push(`${t}${owner ? ` — ${owner}` : ""}`);
  }

  if (!lines.length) return null;
  return lines.map((l, i) => `${i + 1}. ${l}`).join("\n");
}

// ------------------------------------------------------------------- render

export interface RenderInput {
  project: ReportProject;
  update: ReportUpdate | null;
  activity: Activity;
  week: { from: Date; to: Date };
  /** Fill the blanks from the week's activity when there's no update. */
  draft: boolean;
}

/**
 * The whole block, ready to paste into RocketLane.
 *
 * Markdown, because that is what the template is. The Amplify fields are
 * dropped entirely on a non-Amplify engagement rather than left empty, which
 * is what the template's own note asks for.
 */
export function renderUpdate({
  project,
  update,
  activity,
  week,
  draft,
}: RenderInput): string {
  const account = project.clientName ?? project.name;
  const drafted = draft && !update;

  const lines: string[] = [];
  lines.push(`# RocketLane Update — ${account}`);
  lines.push(`Date: ${isoDay(update?.date ?? week.to)}`);
  lines.push(initials(update?.authorName ?? project.ownerName));
  lines.push("");

  lines.push("## Field Values");
  lines.push(`Project Name: ${project.name}`);
  lines.push(
    `Project Status: ${PROJECT_STATUS_LABEL[project.status] ?? "In Progress"}`,
  );
  if (project.isAmplify) {
    lines.push(`Amplify Status: ${or(project.amplifyStatus, PROMPT.amplifyStatus)}`);
  }
  lines.push(`Use Case(s): ${or(project.useCases, PROMPT.useCases)}`);
  lines.push(`KPIs: ${or(project.kpis, PROMPT.kpis)}`);
  if (project.isAmplify) {
    lines.push(`Amplify Product: ${or(project.amplifyProduct, PROMPT.amplifyProduct)}`);
    lines.push(
      `Amplify Data Provider: ${or(project.amplifyDataProvider, PROMPT.amplifyDataProvider)}`,
    );
    lines.push(
      `Amplify Competitor: ${or(project.amplifyCompetitor, PROMPT.amplifyCompetitor)}`,
    );
  }
  lines.push(`RAG Status: ${update ? RAG_LABEL[update.health] : "[Green / Amber / Red]"}`);
  lines.push(`RAG Status Reasons: ${or(update?.ragReasons, PROMPT.ragReasons)}`);
  if (project.isAmplify) {
    lines.push(`Evaluation Start Date: ${day(project.evaluationStartDate)}`);
    lines.push(`Evaluation Due Date: ${day(project.evaluationDueDate)}`);
  }
  lines.push("");

  lines.push("## Project Notes");
  lines.push(
    `Current Status: ${or(
      update?.note,
      drafted ? draftFromActivity(activity) : PROMPT.currentStatus,
    )}`,
  );
  lines.push(`Pain Points: ${or(update?.painPoints, PROMPT.painPoints)}`);
  lines.push(`Risk: ${or(update?.risk, PROMPT.risk)}`);
  lines.push(
    `Next Steps:${block(
      or(
        update?.nextSteps,
        (drafted && draftNextSteps(activity, project.ownerName)) || PROMPT.nextSteps,
      ),
    )}`,
  );
  lines.push(`Notable Customer Quotes: ${or(update?.customerQuotes, PROMPT.customerQuotes)}`);
  lines.push(`Baseline Metrics: ${or(update?.baselineMetrics, PROMPT.baselineMetrics)}`);
  lines.push(`Project Metrics: ${or(update?.projectMetrics, PROMPT.projectMetrics)}`);

  return lines.join("\n");
}

// ------------------------------------------------------------------ helpers

const or = (value: string | null | undefined, fallback: string) =>
  value && value.trim() ? value.trim() : fallback;

/** A multi-line value goes under its label; a one-liner stays beside it. */
const block = (value: string) =>
  value.includes("\n") ? `\n${value}` : ` ${value}`;

export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

const day = (d: Date | null) => (d ? isoDay(d) : PROMPT.date);

/** "Brianna Dunbar-DeMike" -> "BD". The template's [OWNER INITIALS] line. */
export function initials(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "[OWNER INITIALS]";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function andList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}
