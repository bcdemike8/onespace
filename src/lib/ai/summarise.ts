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

export interface AiRead {
  /** A few lines on what the call was about. */
  summary: string;
  actionItems: AiActionItem[];
  model: string;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "action_items"],
  properties: {
    summary: {
      type: "string",
      description:
        "Three to six sentences on what the call was about and what was decided. Plain prose, no bullet points, no preamble.",
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
              "The undertaking as a short instruction, starting with a verb. 'Send the sequence spec to Dana', not 'Brianna said she would send the spec'.",
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
              "The timing exactly as spoken - 'by Friday', 'next week', 'end of the month'. Null if no timing was given. Never invent one.",
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

const SYSTEM = `You are reading the transcript of a client call at RevOptics, a
RevOps consultancy that delivers through Outreach.io and Salesloft. Two jobs:
summarise the call, and list what people undertook to do after it.

On the summary: what the call was for, what was decided, and anything left
open. Three to six sentences. Write it for someone who wasn't there and needs
to pick the work up. No preamble, no "in this call".

On action items, the bar is precision. A missed one costs little - the person
was on the call. A wrong one puts words in someone's mouth on a project plan,
and two of those and nobody trusts the list again.

Include only real undertakings that outlive the call:
- sending, sharing or writing something
- building, changing or configuring something
- booking a meeting, chasing a person, raising a ticket
- looking into something afterwards

Leave out:
- anything done during the call itself ("let me share my screen", "I'll walk
  you through this")
- narration of the agenda ("we're kicking off", "we'll cover X today")
- aims and hopes rather than undertakings ("the goal is to get you live")
- anything hedged into meaninglessness ("we might possibly look at that")
- pleasantries, and anything you are not sure about

Record both sides. Set "ours" false for the client's own commitments - they
are real and worth seeing, but they are not RevOptics work.

"when" is what was actually said, word for word. If nobody said when, it is
null. Never infer a deadline.

If the call produced nothing anyone has to do, return an empty list. That is
a normal and useful answer.`;

/**
 * Summarise a transcript and lift the action items out of it.
 *
 * Returns null when no API key is set, so the caller falls back to the
 * regex rules rather than the sync failing. Throws on a real API failure,
 * which the caller reports - a quota problem should be visible, not
 * silently degrade every call to the weaker reader.
 */
export async function readTranscript(
  transcript: string,
  context: { title: string; when: Date; client: string | null },
): Promise<AiRead | null> {
  if (!aiConfigured()) return null;

  const body = transcript.trim();
  if (body.length < 200) return null;

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
    summary?: string;
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
    return null;
  }

  const summary = (parsed.summary ?? "").trim();
  const actionItems: AiActionItem[] = (parsed.action_items ?? [])
    .filter((i) => typeof i.task === "string" && i.task.trim().length > 2)
    .map((i) => ({
      task: i.task!.trim().slice(0, 200),
      owner: i.owner?.trim() || null,
      ours: i.ours !== false,
      when: i.when?.trim() || null,
      quote: (i.quote ?? "").trim().slice(0, 2000),
    }));

  return { summary, actionItems, model: MODEL };
}
