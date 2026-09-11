import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Reading a call transcript with Claude.
 *
 * The regex rules in src/lib/zoom/commitments.ts are a poor substitute for
 * a model reading the conversation: they can't tell "I'll send the spec"
 * from "I'll send the spec if Dana signs off", they have no idea who Dana
 * is, and they produced thirty pieces of small talk on the first real call
 * they met. They stay as the fallback for when this isn't configured, and
 * that is all they are for now.
 *
 * What crosses the wire, and what comes back, is the whole design question
 * here. The transcript goes to Anthropic for the length of one request and
 * is not stored there under the API's default retention. What is kept in
 * OneSpace is the summary and the action items - not the transcript. That
 * is a change from "the transcript is never stored anywhere" and it is
 * worth saying out loud to anyone who was told the old version.
 */

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

/** Opus, deliberately. A wrong action item costs more than the tokens do. */
const MODEL = "claude-opus-5";

export interface AiActionItem {
  /** The task, as an instruction. */
  task: string;
  /** Who owes it, as the transcript names them. */
  owner: string | null;
  /** True when a RevOptics person owes it rather than the client. */
  ours: boolean;
  /** When they said - "by Friday", "next week" - verbatim, or null. */
  when: string | null;
  /** The sentence it came from, so a person can check rather than trust. */
  quote: string;
}

/** A headed group of bullets, in both the summary and the outline. */
export interface AiSection {
  heading: string;
  bullets: string[];
}

export interface AiRead {
  /** One sentence: who met, and what came of it. */
  overview: string;
  /** The substance, in two to four themed groups. */
  sections: AiSection[];
  /** A second, finer pass following the shape of the call. */
  outline: AiSection[];
  actionItems: AiActionItem[];
  model: string;
}

const SECTIONS = {
  type: "array",
  items: {
    type: "object",
    additionalProperties: false,
    required: ["heading", "bullets"],
    properties: {
      heading: {
        type: "string",
        description:
          "Title Case, two or three words, specific to this call - 'Access Control', 'Classification Design', 'Blockers And Plans'. Never a generic label like 'Discussion' or 'Notes'.",
      },
      bullets: {
        type: "array",
        items: { type: "string" },
        description: "Complete sentences. Three to five per heading.",
      },
    },
  },
} as const;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["overview", "sections", "outline", "action_items"],
  properties: {
    overview: {
      type: "string",
      description:
        "One sentence naming both companies and saying what the call achieved and what blocked it. 'Canopy and RevOptics configured Outreach Amplify research agents and a BDR access profile, but encountered a layout issue that prevented displaying agent results.'",
    },
    sections: {
      ...SECTIONS,
      description:
        "Two to four themed groups covering what was decided and what is outstanding.",
    },
    outline: {
      ...SECTIONS,
      description:
        "Three to five groups following the shape of the call itself - what was covered, in the order it came up. Finer grained than sections, and may repeat their ground from a different angle.",
    },
    action_items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["task", "owner", "ours", "when", "quote"],
        properties: {
          task: {
            type: "string",
            description:
              "A complete instruction, starting with a verb, carrying enough detail to act on months later. 'Submit an Outreach support request explaining that the AI research agents run successfully but their custom fields do not appear when adding research-agent tiles to account or prospect layouts.' Not 'Submit a ticket'.",
          },
          owner: {
            type: ["string", "null"],
            description: "Who owes it, as the transcript names them.",
          },
          ours: {
            type: "boolean",
            description:
              "True when a RevOptics person owes it, false when the client does.",
          },
          when: {
            type: ["string", "null"],
            description:
              "The timing exactly as spoken - 'by Friday', 'before the Tuesday check-in'. Null if none was given. Never invent one.",
          },
          quote: {
            type: "string",
            description:
              "The sentence from the transcript this came from, verbatim.",
          },
        },
      },
    },
  },
} as const;

const SYSTEM = `You are writing up a client call at RevOptics, a RevOps
consultancy that delivers through Outreach.io and Salesloft. The reader is
whoever picks this account up in three months, having not been there.

Produce four things.

OVERVIEW. One sentence. Name both companies, say what the call achieved, and
name the blocker if there was one.

SECTIONS. Two to four themed groups, each with a Title Case heading specific
to this call - "Access Control", "Classification Design", "Blockers And
Plans" - and three to five complete sentences under it. This is the
substance: what was decided, configured, agreed or left open.

OUTLINE. Three to five groups following the shape of the call, in the order
things came up. Finer grained than the sections, and it may cover the same
ground from a different angle.

ACTION ITEMS. What people undertook to do afterwards.

Throughout:

Keep the specifics. Custom field numbers, tool names, people's names, dates
and times as spoken, the exact wording of a decision. "Stored results in
Custom 23" is worth more than "stored the results". A summary that drops the
field number is a summary somebody has to re-listen to the call to use.

Name who said or did what, using the names in the transcript.

Write complete sentences, not fragments. Past tense for what happened.

Action items are instructions, not descriptions - start with a verb and carry
enough detail to act on cold. "Submit an Outreach support request explaining
that the research agents run but their custom fields don't appear in layout
configuration" rather than "Submit a ticket". Where one depends on something
else, say so: "After receiving the updated configuration, import it in
Outreach before the Tuesday check-in."

Record both sides. Set "ours" false for the client's own commitments - real
and worth seeing, but not RevOptics work.

Leave out anything done during the call itself, narration of the agenda,
aims rather than undertakings, and anything hedged into meaninglessness. If
nothing was undertaken, return an empty list; that is a useful answer.`;

/** The write-up as text, for pasting into a recap email. */
export function renderSummary(read: {
  overview: string;
  sections: AiSection[];
  outline: AiSection[];
  actionItems: AiActionItem[];
}): string {
  const out: string[] = ["Overview", read.overview];

  for (const s of read.sections) {
    out.push("", s.heading, ...s.bullets.map((b) => `- ${b}`));
  }

  if (read.actionItems.length > 0) {
    out.push("", "Action Items");
    for (const a of read.actionItems) {
      const who = a.owner ? ` (@${a.owner})` : "";
      const when = a.when ? ` — ${a.when}` : "";
      out.push(`- ${a.task}${when}${who}`);
    }
  }

  if (read.outline.length > 0) {
    out.push("", "Outline");
    for (const s of read.outline) {
      out.push("", s.heading, ...s.bullets.map((b) => `- ${b}`));
    }
  }

  return out.join("\n");
}

export interface AiAttempt {
  /** The write-up, when there is one. */
  read: AiRead | null;
  /** Why there isn't, in words. Null when there is. */
  reason: string | null;
}

/**
 * Summarise a transcript and lift the action items out of it.
 *
 * Every way of not producing a write-up says which way it was. This used to
 * return a bare null for three quite different situations - no API key, a
 * transcript too short to be worth reading, an answer that wouldn't parse -
 * and the caller could only fall through to the old pattern rules and store
 * nothing, leaving the meeting with an empty write-up panel and no clue as
 * to why. Throws on a real API failure, which the caller reports: a quota
 * problem should be loud, not a month of quietly worse summaries.
 */
export async function readTranscript(
  transcript: string,
  context: { title: string; when: Date; client: string | null },
): Promise<AiAttempt> {
  if (!aiConfigured()) {
    return {
      read: null,
      reason:
        "Claude isn't connected on this service, so no write-up was made - the call was scanned with the old pattern rules instead. Set ANTHROPIC_API_KEY in Railway on both the app service and the cron service, then use Re-read transcripts on the meetings list.",
    };
  }

  const body = transcript.trim();
  if (body.length < 200) {
    return {
      read: null,
      reason: `The transcript for this call is only ${body.length} characters - too little to write anything up from. Zoom produces one of these when a call is mostly silence, or when it ended before anyone spoke.`,
    };
  }

  const client = new Anthropic();

  const header = [
    `Meeting: ${context.title}`,
    `Date: ${context.when.toISOString().slice(0, 10)}`,
    context.client ? `Client: ${context.client}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // Streamed because a two-hour call is a large input and a non-streaming
  // request can outrun the HTTP timeout waiting for the first byte.
  const message = await client.messages
    .stream({
      model: MODEL,
      max_tokens: 8000,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `${header}\n\nTranscript:\n\n${body}`,
        },
      ],
    })
    .finalMessage();

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: {
    overview?: string;
    sections?: { heading?: string; bullets?: string[] }[];
    outline?: { heading?: string; bullets?: string[] }[];
    action_items?: {
      task?: string;
      owner?: string | null;
      ours?: boolean;
      when?: string | null;
      quote?: string;
    }[];
  };
  try {
    parsed = JSON.parse(text);
  } catch {
    // The schema makes this close to impossible, but a malformed answer
    // should cost this one meeting rather than the whole sync.
    return {
      read: null,
      reason: "Claude's answer for this call didn't parse. Worth trying again.",
    };
  }

  const groups = (raw: { heading?: string; bullets?: string[] }[] | undefined): AiSection[] =>
    (raw ?? [])
      .map((g) => ({
        heading: (g.heading ?? "").trim(),
        bullets: (g.bullets ?? []).map((b) => b.trim()).filter(Boolean),
      }))
      .filter((g) => g.heading && g.bullets.length > 0);

  const actionItems: AiActionItem[] = (parsed.action_items ?? [])
    .filter((i) => typeof i.task === "string" && i.task.trim().length > 2)
    .map((i) => ({
      task: i.task!.trim().slice(0, 400),
      owner: i.owner?.trim() || null,
      ours: i.ours !== false,
      when: i.when?.trim() || null,
      quote: (i.quote ?? "").trim().slice(0, 2000),
    }));

  return {
    read: {
      overview: (parsed.overview ?? "").trim(),
      sections: groups(parsed.sections),
      outline: groups(parsed.outline),
      actionItems,
      model: MODEL,
    },
    reason: null,
  };
}
