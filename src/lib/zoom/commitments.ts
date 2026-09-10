// Lifting promises out of a call transcript.
//
// The thing Brianna actually wants: when someone from RevOptics says "I'll
// send over the instructions" or "let me book another session", that becomes
// a task, so the call and the follow-through don't drift apart.
//
// Pure functions over text. No database, no Zoom, no model - the rules can be
// argued with, tested against real sentences, and read by whoever is wondering
// why a task did or didn't appear.
//
// The bar is precision, not recall. A missed promise costs nothing much: the
// person was on the call and remembers. A wrong one puts words in their mouth
// on a project plan, and two of those and nobody trusts the feature again. So
// every rule below leans toward saying nothing.

export interface TranscriptCue {
  /** Seconds from the start of the call. */
  atSeconds: number;
  speaker: string | null;
  text: string;
}

export interface Commitment {
  text: string;
  speaker: string | null;
  atSeconds: number;
  suggestedTask: string;
}

// ------------------------------------------------------------------- parsing

const timeToSeconds = (stamp: string): number => {
  const m = stamp.match(/(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/);
  if (!m) return 0;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
};

/**
 * Zoom's VTT into cues.
 *
 * Speaker names arrive as a "Name: " prefix on the caption line. A caption
 * with no prefix continues whoever spoke last, which matters because Zoom
 * breaks a long sentence across cues and only labels the first.
 */
export function parseVtt(vtt: string): TranscriptCue[] {
  const cues: TranscriptCue[] = [];
  let lastSpeaker: string | null = null;

  for (const block of vtt.replace(/\r/g, "").split(/\n\s*\n/)) {
    const lines = block.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length === 0) continue;

    const timing = lines.find((l) => l.includes("-->"));
    if (!timing) continue;

    const body = lines.slice(lines.indexOf(timing) + 1).join(" ").trim();
    if (!body) continue;

    // "Dana Scully: text" - but not "https://..." and not a time like "3:15".
    const labelled = body.match(/^([A-Z][^:]{1,60}?):\s+(.*)$/s);
    let speaker: string | null = lastSpeaker;
    let text = body;
    if (labelled && !/^\d+$/.test(labelled[1]) && !labelled[1].includes("//")) {
      speaker = labelled[1].trim();
      text = labelled[2].trim();
      lastSpeaker = speaker;
    }

    cues.push({ atSeconds: timeToSeconds(timing), speaker, text });
  }

  return cues;
}

/**
 * Consecutive cues from one speaker, joined.
 *
 * Zoom cuts a caption every few seconds, so "I'll send you the" and "config
 * over tomorrow" are two cues. Judging them separately finds nothing.
 */
export function joinTurns(cues: TranscriptCue[]): TranscriptCue[] {
  const turns: TranscriptCue[] = [];
  for (const cue of cues) {
    const last = turns[turns.length - 1];
    if (last && last.speaker === cue.speaker) {
      last.text = `${last.text} ${cue.text}`.replace(/\s+/g, " ");
    } else {
      turns.push({ ...cue });
    }
  }
  return turns;
}

// ------------------------------------------------------------------- rules

/** How a promise starts. The subject has to be the speaker. */
const PROMISE = [
  /\bi(?:'| a)?m going to\b/i,
  /\bi(?:'|’)?ll\b/i,
  /\bi will\b/i,
  /\bi(?:'| a)?m gonna\b/i,
  /\bi can\b/i,
  /\blet me\b/i,
  /\bwe(?:'|’)?ll\b/i,
  /\bwe will\b/i,
  /\bwe(?:'| a)?re going to\b/i,
  /\bi(?:'|’)?d be happy to\b/i,
];

/** Said in the room, done in the room. Not a task. */
const IN_CALL = [
  /\b(share|sharing|stop sharing|present|pull up|pull that up|bring up|show you|scroll|zoom in|unmute|mute|record|screenshot)\b/i,
  /\b(see|hear|read) (you|your|that|this|it|the screen)\b/i,
  /\blet me (see|check|look|think|find|grab|pull)\b/i,
  /\bi can (see|hear|tell|imagine|understand|appreciate|relate)\b/i,
  /\bdrop (it|that|the link) in the chat\b/i,
];

/** Not a promise, whatever it looks like. */
const NOT_A_PROMISE = [
  /\bi (won'?t|can'?t|cannot|shouldn'?t|didn'?t|haven'?t)\b/i,
  /\bi(?:'|’)?m not\b/i,
  /\bwe (won'?t|can'?t|cannot)\b/i,
  // Hypothetical rather than committed.
  /\b(if|unless|whether|maybe|might|possibly|probably should|could potentially)\b.{0,20}\bi(?:'|’)?ll\b/i,
  /\bi would\b/i,
  /\bi might\b/i,
  /\bi(?:'|’)?d have to\b/i,
  // Turns of phrase, not undertakings.
  /\bi(?:'|’)?ll (be honest|say|admit|tell you|bet|give you that|hand it to you)\b/i,
  /\blet me know\b/i,
  /\bcan i\b/i,
  /\bwill i\b/i,
  /\bi can'?t? (?:hear|see)\b/i,
  // Talking about someone else doing it.
  /\bi(?:'|’)?ll (?:let|have|get) (you|them|him|her|the team) (know|do|handle|take)\b/i,
];

/** Filler at the front of a spoken sentence, stripped for the task title. */
const OPENERS =
  /^(?:(?:yeah|yep|yes|no|okay|ok|alright|right|so|and|but|well|um+|uh+|like|i mean|actually|sure|great|perfect|awesome|cool|gotcha|absolutely|definitely|for sure|sounds good|no problem|of course)[,.]?\s+)+/i;

/** Hedges that shouldn't survive into a task title. */
const HEDGES =
  /^(?:(?:probably|maybe|likely|just|also|then|now|quickly|certainly|obviously|basically|honestly)\s+)+/i;

const SENTENCE_SPLIT = /(?<=[.!?])\s+|(?<=\.)\s*(?=[A-Z])/;

/** Reduce a spoken promise to something that reads as a task. */
export function toTaskTitle(sentence: string): string {
  let s = sentence.trim().replace(/\s+/g, " ");
  s = s.replace(OPENERS, "");

  // Strip the subject and the promise verb, leaving the action.
  s = s.replace(
    /^(?:i(?:'|’)?(?:ll|m)|i will|i am|i can|we(?:'|’)?ll|we will|we can|let me|i(?:'|’)?m going to|i am going to|i(?:'|’)?m gonna|we(?:'|’)?re going to)\s+/i,
    "",
  );
  s = s.replace(/^(?:going to|gonna|go ahead and|make sure (?:to|i)|try to|need to|have to)\s+/i, "");
  s = s.replace(HEDGES, "");

  // Trailing conversational tails.
  s = s.replace(
    /[,;]?\s*(?:if that (?:works|helps)|okay|ok|alright|does that (?:work|sound good)|sound good|for you|as well|too)\s*[.?!]*$/i,
    "",
  );
  s = s.replace(/[.!?,;:\s]+$/, "");

  if (s.length === 0) return sentence.trim().slice(0, 120);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const looksLikeCommitment = (sentence: string): boolean => {
  if (sentence.trim().endsWith("?")) return false;
  if (!PROMISE.some((r) => r.test(sentence))) return false;
  if (NOT_A_PROMISE.some((r) => r.test(sentence))) return false;
  if (IN_CALL.some((r) => r.test(sentence))) return false;

  // A promise needs an object. "I'll do it" is technically one and useless as
  // a task; four words of substance is the floor.
  const words = toTaskTitle(sentence).split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;

  return true;
};

/**
 * Commitments made by our own people on a call.
 *
 * `ours` is the set of speaker names belonging to RevOptics. Only they are
 * read: a client saying "I'll send you the credentials" is their promise to
 * keep, and putting it on a RevOptics timesheet would be wrong.
 */
export function extractCommitments(
  cues: TranscriptCue[],
  ours: (speaker: string | null) => boolean,
): Commitment[] {
  const out: Commitment[] = [];
  const seen = new Set<string>();

  for (const turn of joinTurns(cues)) {
    if (!ours(turn.speaker)) continue;

    for (const raw of turn.text.split(SENTENCE_SPLIT)) {
      const sentence = raw.trim();
      if (sentence.length < 8 || !looksLikeCommitment(sentence)) continue;

      const suggestedTask = toTaskTitle(sentence);

      // The same promise repeated - restated, or confirmed at the end of the
      // call - is one task.
      const key = suggestedTask.toLowerCase().replace(/[^a-z0-9 ]/g, "");
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        text: sentence,
        speaker: turn.speaker,
        atSeconds: turn.atSeconds,
        suggestedTask: suggestedTask.slice(0, 200),
      });
    }
  }

  return out;
}

/**
 * Zoom's own next-steps list, when AI Companion produced one.
 *
 * Preferred over the transcript rules where it exists: Zoom had the audio and
 * the speaker labels, and these are already written as actions. Marked as
 * coming from the summary so the screen can say where each one came from.
 */
export function fromNextSteps(steps: string[]): Commitment[] {
  const out: Commitment[] = [];
  const seen = new Set<string>();

  for (const raw of steps) {
    const step = raw.trim().replace(/^[-*•]\s*/, "").replace(/\s+/g, " ");
    if (step.length < 6) continue;

    const key = step.toLowerCase().replace(/[^a-z0-9 ]/g, "");
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      text: step,
      speaker: null,
      atSeconds: 0,
      suggestedTask: (step.charAt(0).toUpperCase() + step.slice(1)).slice(0, 200),
    });
  }

  return out;
}
