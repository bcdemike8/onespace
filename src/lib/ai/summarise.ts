import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Reading a call transcript with Claude.
 *
 * The regex rules in src/lib/zoom/commitments.ts are a poor substitute for
 * a model reading the conversation: they can't tell "I'll send the spec"
 * from "I'll send the spec if Dana signs off", they have no idea who Dana
 * is, and they produced thirty pieces of small talk on the first real call
 * they met. They are no longer a fallback: a call Claude can't read gets
 * no action items rather than guessed ones, and says why on the call.
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
  /** A short task title - a dozen words, starting with a verb. */
  title: string;
  /** The task, as a full instruction. */
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
        required: ["title", "task", "owner", "ours", "when", "quote"],
        properties: {
          title: {
            type: "string",
            description:
              "A short task title: at most 12 words, starting with a verb, naming the deliverable and who it's for. 'Send Canopy the research-agent field mapping'. The detail belongs in task, not here.",
          },
          task: {
            type: "string",
            description:
              "A complete instruction, starting with a verb, carrying enough detail to act on months later. 'Submit an Outreach support request explaining that the AI research agents run successfully but their custom fields do not appear when adding research-agent tiles to account or prospect layouts.' Not 'Submit a ticket'.",
          },
          // anyOf rather than type: ["string", "null"]. The structured-output
          // schema supports null as a type and anyOf as a combinator; a type
          // array is neither, and an unsupported construct fails the whole
          // request rather than the one field.
          owner: {
            anyOf: [{ type: "string" }, { type: "null" }],
            description:
              "The one person who took it on. For RevOptics, their full name exactly as it appears in the list of RevOptics people. Null only when no single person can be named.",
          },
          ours: {
            type: "boolean",
            description:
              "True only when the owner is on the list of RevOptics people. False when the client owes it.",
          },
          when: {
            anyOf: [{ type: "string" }, { type: "null" }],
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

ACTION ITEMS. What specific people undertook to do after the call.

Throughout:

Keep the specifics. Custom field numbers, tool names, people's names, dates
and times as spoken, the exact wording of a decision. "Stored results in
Custom 23" is worth more than "stored the results". A summary that drops the
field number is a summary somebody has to re-listen to the call to use.

Name who said or did what, using the names in the transcript.

Write complete sentences, not fragments. Past tense for what happened.

Action items. A RevOptics action item ("ours": true) is something one named
RevOptics person agreed to deliver to the client, or to do on the client's
behalf: "I'll send you the updated sequence spec by Friday", "Marcus will
raise a support case with Outreach for you". The message lists the RevOptics
people; anyone not on that list is the client's side. Each RevOptics item
needs:
- owner: the one RevOptics person who took it on, written exactly as their
  name appears in that list. If you can't tell which single RevOptics person
  took it on, leave the item out.
- title: at most 12 words, starting with a verb - "Send Canopy the
  research-agent field mapping". It goes on a to-do list, so keep it short.
- task: the full instruction, with enough detail to act on cold. "Submit an
  Outreach support request explaining that the research agents run but their
  custom fields don't appear in layout configuration" rather than "Submit a
  ticket". Where it depends on something else, say so.

An instruction RevOptics gives the client - "you'll want to create the
field", "go ahead and map the stage" - is the client's item, not ours,
however much RevOptics talked about it.

Not action items, on either side - leave all of these out:
- ideas, plans and possibilities: "we'll want to create a custom field",
  "we should look at", "it might be worth", "the next phase will";
- things said by "we" with nobody taking them on;
- RevOptics' own housekeeping that isn't for the client;
- anything done during the call itself, and narration of the agenda;
- anything hedged into meaninglessness.

Also record the client's own commitments, with "ours" false and the client
person as owner - real and worth seeing in the write-up, but not RevOptics
work. Fewer, real commitments are worth more than a long list: if nothing
was undertaken, return an empty list; that is a useful answer.`;

/**
 * The title as asked for, or the start of the instruction when the answer
 * left it out or ran long - a to-do list row has to stay one line.
 */
export function shortTitle(title: string | undefined, task: string): string {
  const words = (title?.trim() || task.trim()).split(/\s+/).filter(Boolean);
  const cut = words.slice(0, 14).join(" ").replace(/[.,;:]+$/, "");
  return words.length > 14 ? `${cut}…` : cut;
}

type RawActionItem = {
  title?: string;
  task?: string;
  owner?: string | null;
  ours?: boolean;
  when?: string | null;
  quote?: string;
};

/**
 * The action items as the answer gave them, tidied.
 *
 * "ours" only when the answer said so in as many words: a missing flag is
 * not a RevOptics undertaking, and treating it as one is how the client's
 * own to-dos used to land on our lists.
 */
function toActionItems(raw: RawActionItem[] | undefined): AiActionItem[] {
  return (raw ?? [])
    .filter((i) => typeof i.task === "string" && i.task.trim().length > 2)
    .map((i) => ({
      title: shortTitle(i.title, i.task!),
      task: i.task!.trim().slice(0, 400),
      owner: i.owner?.trim() || null,
      ours: i.ours === true,
      when: i.when?.trim() || null,
      quote: (i.quote ?? "").trim().slice(0, 2000),
    }));
}

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
/**
 * Run the request, and turn a timeout into something a person can act on.
 *
 * "APIConnectionTimeoutError" on a meeting card tells nobody anything. What
 * matters is that the ceiling stopped it, not the model or the network, and
 * that the overnight job has a bigger one.
 */
async function runOrExplain<T>(timeoutMs: number, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof Anthropic.APIConnectionTimeoutError) {
      throw new Error(
        `it took longer than ${Math.round(timeoutMs / 1000)} seconds and was stopped so the page could answer. The nightly job has longer, and will pick this up.`,
      );
    }
    throw e;
  }
}

export async function readTranscript(
  transcript: string,
  context: {
    title: string;
    when: Date;
    client: string | null;
    /** Everyone at RevOptics, by full name, so owners can be named exactly. */
    team?: string[];
  },
  /**
   * How long this one read may take.
   *
   * Required, and deliberately so. Reading a call happens inside whatever
   * asked for it - a button press, a cron request - and a model given room
   * to think will use it. Without a ceiling the request outlives the
   * browser's patience and the person gets "an unexpected response was
   * received from the server", which is the shape every timeout takes.
   */
  timeoutMs: number,
): Promise<AiAttempt> {
  if (!aiConfigured()) {
    return {
      read: null,
      reason:
        "Claude isn't connected on this service, so no write-up or action items were made. Set ANTHROPIC_API_KEY in Railway on both the app service and the cron service, then use Re-read transcripts on the meetings list.",
    };
  }

  const body = transcript.trim();
  if (body.length < 200) {
    return {
      read: null,
      reason: `The transcript for this call is only ${body.length} characters - too little to write anything up from. Zoom produces one of these when a call is mostly silence, or when it ended before anyone spoke.`,
    };
  }

  // No retries. The SDK retries timeouts by default, which multiplies the
  // wall clock by three and defeats the ceiling above. A call that fails
  // leaves the meeting unread, so the next sync picks it up - retrying here
  // as well would only mean failing three times as slowly.
  const client = new Anthropic({ maxRetries: 0 });

  const header = [
    `Meeting: ${context.title}`,
    `Date: ${context.when.toISOString().slice(0, 10)}`,
    context.client ? `Client: ${context.client}` : null,
    context.team && context.team.length > 0
      ? `RevOptics people: ${context.team.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  // Streamed because a two-hour call is a large input and a non-streaming
  // request can outrun the HTTP timeout waiting for the first byte.
  const message = await runOrExplain(timeoutMs, () =>
    client.messages
    .stream(
      {
        model: MODEL,
        // Room to think and still write the whole document.
        //
        // This was 8000, which is the likeliest reason every call came back
        // without a write-up. Adaptive thinking spends from the same budget as
        // the answer, and the answer here is an overview, two to four themed
        // sections, three to five outline groups and every action item with the
        // sentence it came from. Run out and the JSON stops mid-string, which
        // arrives as a parse failure rather than as "too long" - so it looked
        // like a bad answer rather than a budget. Streaming means a large
        // ceiling costs nothing when it isn't used.
        max_tokens: 64000,
        system: SYSTEM,
        thinking: { type: "adaptive" },
        output_config: {
          // A wrong action item costs more than the tokens do, and this is the
          // level the guidance asks for on work where the judgement matters.
          effort: "high",
          format: { type: "json_schema", schema: SCHEMA },
        },
        messages: [
          {
            role: "user",
            content: `${header}\n\nTranscript:\n\n${body}`,
          },
        ],
      },
      { timeout: timeoutMs },
    )
    .finalMessage(),
  );

  // Why it stopped, before trying to read what it said. A truncated or
  // declined answer is a different problem from a malformed one, and
  // finding out by watching JSON.parse fail loses that distinction.
  if (message.stop_reason === "max_tokens") {
    return {
      read: null,
      reason:
        "Claude ran out of room writing this call up, so the answer came back cut off. The transcript is unusually long - tell me and I'll raise the limit.",
    };
  }
  if (message.stop_reason === "refusal") {
    return {
      read: null,
      reason: `Claude declined to write this call up${
        message.stop_details?.explanation ? `: ${message.stop_details.explanation}` : "."
      }`,
    };
  }

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: {
    overview?: string;
    sections?: { heading?: string; bullets?: string[] }[];
    outline?: { heading?: string; bullets?: string[] }[];
    action_items?: {
      title?: string;
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
      reason: `Claude's answer for this call didn't parse (${text.length} characters, stopped because ${message.stop_reason ?? "unknown"}). Worth trying again.`,
    };
  }

  const groups = (raw: { heading?: string; bullets?: string[] }[] | undefined): AiSection[] =>
    (raw ?? [])
      .map((g) => ({
        heading: (g.heading ?? "").trim(),
        bullets: (g.bullets ?? []).map((b) => b.trim()).filter(Boolean),
      }))
      .filter((g) => g.heading && g.bullets.length > 0);

  const actionItems = toActionItems(parsed.action_items);

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

// ------------------------------------------------------------ recap emails

const RECAP_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["action_items"],
  properties: { action_items: SCHEMA.properties.action_items },
} as const;

/**
 * Reading a recap email a consultant sent to a client.
 *
 * The question is narrower than for a call: not "what happened" but "which
 * of these is RevOptics' to do". A recap is usually written to the client
 * and lists what *they* have to do next, so most lists in most recaps are
 * not ours. The worked examples use a made-up client on purpose - this file
 * is in a public repository.
 */
const RECAP_SYSTEM = `You are reading a recap email that someone at RevOptics,
a RevOps consultancy, sent to a client after a call. Your one job is to find
the action items that are RevOptics' to do.

The message tells you who sent it, which client it went to, and who the
RevOptics people are. Anyone not on that list is the client's side.

A RevOptics action item ("ours": true) is something the email says a
RevOptics person will do - deliver something to the client, or do something
on the client's behalf. The email has to say so:
- the sender in the first person: "I'll send over the field mapping doc by
  Friday" - owner is the sender;
- a named RevOptics person: "Marcus will configure the sequences for you",
  "Marcus to build the dashboard" - owner is Marcus;
- RevOptics as a team, from a RevOptics sender: "On our side, we'll build
  the dashboard", "RevOptics will run the import" - owner is the sender.

Everything else is not ours. In particular:
- A list of instructions addressed to the client is the client's to do,
  however it's introduced. Say the client is Northwind and the recap reads
  "Here is a recap of the remaining items we need to address: 1. Create a
  custom 'Region' field on the Account object and map it in Outreach.
  2. Confirm whether the sandbox has API access." Both are Northwind's items,
  not ours.
- A named client person: "Dana to confirm the Salesforce setting".
- A shared "we" with nobody taking it on, or a joint decision: "we'll need to
  confirm whether...", "determine whether a historical sync is needed and
  agree on the timeframe".
- Ideas, plans, possibilities and anything hedged.

When you can't tell whether RevOptics took something on, leave it out. An
empty list is a correct and useful answer - most recaps list the client's
next steps, not ours.

For each RevOptics item give:
- owner: the RevOptics person's full name exactly as it appears in the list.
- title: at most 12 words, starting with a verb.
- task: the full instruction, with enough detail to act on cold.
- when: the timing exactly as written, or null. Never invent one.
- quote: the line or sentence it came from, verbatim.

You may include the client's items with "ours": false; they won't be used.`;

/**
 * The RevOptics action items in a recap email, read by Claude.
 *
 * Throws on a real API failure, so the caller can leave the message unread
 * and try again on the next sync rather than lose it.
 */
export async function readRecap(
  body: string,
  context: {
    subject: string;
    sentAt: Date;
    sender: string;
    client: string | null;
    team: string[];
  },
  timeoutMs: number,
): Promise<{ items: AiActionItem[] | null; reason: string | null }> {
  if (!aiConfigured()) {
    return { items: null, reason: "Claude isn't connected on this service." };
  }
  const text = body.trim();
  if (text.length < 40) return { items: [], reason: null };

  const client = new Anthropic({ maxRetries: 0 });
  const header = [
    `Subject: ${context.subject}`,
    `Sent: ${context.sentAt.toISOString().slice(0, 10)}`,
    `From: ${context.sender} (RevOptics)`,
    context.client ? `To: ${context.client} (the client)` : "To: the client",
    context.team.length > 0 ? `RevOptics people: ${context.team.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const message = await runOrExplain(timeoutMs, () =>
    client.messages
      .stream(
        {
          model: MODEL,
          // A recap is a few hundred words; this is room to think, not a
          // budget anyone expects to spend.
          max_tokens: 16000,
          system: RECAP_SYSTEM,
          thinking: { type: "adaptive" },
          output_config: {
            effort: "high",
            format: { type: "json_schema", schema: RECAP_SCHEMA },
          },
          messages: [{ role: "user", content: `${header}\n\nEmail:\n\n${text}` }],
        },
        { timeout: timeoutMs },
      )
      .finalMessage(),
  );

  if (message.stop_reason === "max_tokens" || message.stop_reason === "refusal") {
    return { items: null, reason: `Claude stopped (${message.stop_reason}) reading this recap.` };
  }
  const out = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  try {
    const parsed = JSON.parse(out) as { action_items?: RawActionItem[] };
    return { items: toActionItems(parsed.action_items), reason: null };
  } catch {
    return { items: null, reason: "Claude's answer for this recap didn't parse." };
  }
}
