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

/**
 * How far consecutive cues from one speaker are stitched together.
 *
 * Zoom cuts a caption every few seconds, so "I'll send you the" and "config
 * over tomorrow" have to be rejoined or nothing is ever found. But joining
 * without a limit turns a four-minute monologue into a single string, and
 * every rule below then reads the wrong part of it.
 */
const JOIN_LIMIT_CHARS = 320;
const JOIN_LIMIT_SECONDS = 30;

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
    // Joined only while the turn is still sentence-sized. Someone talking
    // for four minutes is not one utterance, and treating it as one is how
    // a promise at the end got a title made of the beginning.
    const stillShort =
      last &&
      last.speaker === cue.speaker &&
      last.text.length < JOIN_LIMIT_CHARS &&
      cue.atSeconds - last.atSeconds < JOIN_LIMIT_SECONDS;

    if (stillShort) {
      last.text = `${last.text} ${cue.text}`.replace(/\s+/g, " ");
    } else {
      turns.push({ ...cue });
    }
  }
  return turns;
}

/**
 * A turn broken into things that can each be judged.
 *
 * Punctuation first, because when Zoom provides it it is right. When it
 * doesn't - and it often doesn't - fall back to breaking before each
 * promise marker, so at least the promise starts its own utterance instead
 * of trailing eighty words of unrelated speech.
 */
export function utterances(text: string): string[] {
  const bySentence = text.split(SENTENCE_SPLIT).map((t) => t.trim()).filter(Boolean);

  const out: string[] = [];
  for (const piece of bySentence) {
    if (piece.split(/\s+/).length <= RUN_ON_WORDS) {
      out.push(piece);
      continue;
    }
    // Unpunctuated run-on: cut immediately before each promise marker.
    const cuts = new Set<number>([0]);
    for (const rule of PROMISE) {
      const global = new RegExp(rule.source, "gi");
      for (const m of piece.matchAll(global)) {
        if (m.index !== undefined && m.index > 0) cuts.add(m.index);
      }
    }
    const points = [...cuts].sort((a, b) => a - b);
    for (let i = 0; i < points.length; i++) {
      const chunk = piece.slice(points[i], points[i + 1]).trim();
      if (chunk) out.push(chunk);
    }
  }
  return out;
}

// ------------------------------------------------------------------- rules

/**
 * How a promise starts. The subject has to be the speaker, and the match
 * position matters as much as the match: the title is cut from here, not
 * from the start of whatever sentence this landed in.
 *
 * Deliberately narrower than it reads. "Let me" and "I can" were in this
 * list and were the single largest source of nonsense - "let me give him a
 * minute", "I can see that", "let me walk you through" are all conversation,
 * not undertakings. They now only count in front of a delivery verb, which
 * the ACTION test below enforces on everything anyway.
 */
export const PROMISE = [
  /\bi(?:'|’| a)?m going to\b/i,
  /\bi(?:'|’)?ll\b/i,
  /\bi will\b/i,
  /\bi(?:'|’| a)?m gonna\b/i,
  /\bi(?:'|’)?d be happy to\b/i,
  /\bwe(?:'|’)?ll\b/i,
  /\bwe will\b/i,
  /\bwe(?:'|’| a)?re going to\b/i,
  /\bwe(?:'|’| a)?re gonna\b/i,
  /\blet me\b/i,
  /\bi can\b/i,
];

/**
 * What makes it work rather than talk.
 *
 * The rule that does the real filtering. A promise has to hand over a thing
 * or move something outside the call: send it, write it, book it, raise it.
 * Without this, every "we're gonna walk you through" and "let me give him a
 * minute" reads as a commitment, because grammatically it is one.
 *
 * Being an allowlist, it misses undertakings phrased in ways nobody
 * anticipated. That is the trade this whole file makes on purpose.
 */
const ACTION = [
  // Handing something over.
  /\b(send|share out|forward|email|get (?:you|that|it|this|them)|pass (?:along|over)|drop (?:you|that|it) (?:a|an|the)|deliver|provide)\b/i,
  // Making something.
  /\b(write|draft|put together|pull together|build|create|make (?:you|a|the)|prepare|produce|spin up|mock up|document|spec out)\b/i,
  // Changing something that exists.
  /\b(update|fix|change|adjust|clean up|rework|rebuild|migrate|configure|set up|stand up|import|upload|load)\b/i,
  // Arranging something.
  /\b(book|schedule|set (?:up )?a (?:call|meeting|session|time)|get (?:some )?time|invite|calendar|line up|arrange)\b/i,
  // Chasing something.
  /\b(follow up|circle back|check (?:with|on|in with)|chase|confirm with|sync with|loop (?:in|back)|reach out|touch base)\b/i,
  // Raising something elsewhere.
  /\b(raise|submit|file|log|open) (?:a|an|the)? ?(ticket|case|bug|request|issue|support)\b/i,
  /\b(raise|escalate) (?:it|this|that) with\b/i,
  // Looking into something after the call.
  /\b(look into|dig into|investigate|research|review|audit|test|validate|verify)\b/i,
  // Recaps and notes, which are most of what a consultant promises.
  /\b(recap|write ?up|summar(?:y|ise|ize)|notes|minutes|action items)\b/i,
];

/** Said in the room, done in the room. Not a task. */
export const IN_CALL = [
  /\b(share|sharing|stop sharing|present|pull up|pull that up|bring up|show you|scroll|zoom in|unmute|mute|record|screenshot)\b/i,
  /\b(see|hear|read) (you|your|that|this|it|the screen)\b/i,
  /\blet me (see|check|look|think|find|grab|pull|start|begin|explain|show|walk|give|jump|dive|talk|run)\b/i,
  /\bi can (see|hear|tell|imagine|understand|appreciate|relate)\b/i,
  /\bdrop (it|that|the link) in the chat\b/i,
  // Narrating the call itself. All of these produced tasks on real calls.
  /\b(walk|take) (you|y'all|everyone|us) (guys )?through\b/i,
  /\b(we(?:'|’)?re |i(?:'|’)?m )?(kick(?:ing)? off|get(?:ting)? started|jump(?:ing)? (?:in|into)|dive?(?:ing)? (?:in|into)|mov(?:e|ing)? on|come? back to)\b/i,
  /\bgive (?:him|her|them|it|us|you) a (?:minute|second|sec|moment|two)\b/i,
  /\b(spend|take) (?:too much |a lot of )?time on\b/i,
  /\bcover (?:that|this|it|a lot|everything)\b/i,
  /\bmake sure (?:that )?(?:we|you|i) (?:don(?:'|’)?t|understand|know|(?:are|'re) (?:all )?on the same page)\b/i,
];

/** Not a promise, whatever it looks like. */
export const NOT_A_PROMISE = [
  /\bi (won'?t|can'?t|cannot|shouldn'?t|didn'?t|haven'?t)\b/i,
  /\bi(?:'|’)?m not\b/i,
  /\bwe (won'?t|can'?t|cannot)\b/i,
  // Hypothetical rather than committed.
  /\b(if|unless|whether|maybe|might|possibly|probably should|could potentially)\b.{0,20}\b(i|we)(?:'|’)?ll\b/i,
  /\bi would\b/i,
  /\bi might\b/i,
  /\bi(?:'|’)?d have to\b/i,
  // Hedged to the point of meaning nothing. "Probably, potentially, bring
  // in Shannon" is thinking aloud, and it became a task on a real call.
  /\b(probably|potentially|maybe|possibly|perhaps|might|hopefully|ideally)\b/i,
  // Turns of phrase, not undertakings.
  /\bi(?:'|’)?ll (be honest|say|admit|tell you|bet|give you that|hand it to you)\b/i,
  /\blet me know\b/i,
  /\bcan i\b/i,
  /\bwill i\b/i,
  /\bi can'?t? (?:hear|see)\b/i,
  // Talking about someone else doing it.
  /\bi(?:'|’)?ll (?:let|have|get) (you|them|him|her|the team) (know|do|handle|take)\b/i,
  // Describing an aim, not taking one on. "The goal is to get you live."
  /\bthe (goal|idea|plan|hope|thinking) (is|was)\b/i,
];

/** Filler at the front of a spoken sentence, stripped for the task title. */
const OPENERS =
  /^(?:(?:yeah|yep|yes|no|okay|ok|alright|right|so|and|but|well|um+|uh+|like|i mean|actually|sure|great|perfect|awesome|cool|gotcha|absolutely|definitely|for sure|sounds good|no problem|of course)[,.]?\s+)+/i;

/** Hedges that shouldn't survive into a task title. */
const HEDGES =
  /^(?:(?:probably|maybe|likely|just|also|then|now|quickly|certainly|obviously|basically|honestly)\s+)+/i;

/**
 * Sentence boundaries, and a fallback for transcripts that have none.
 *
 * Zoom punctuates some transcripts and not others. Where it doesn't, a
 * speaker's whole turn arrives as one unbroken string, and treating that as
 * a sentence is how "I'll send the spec" three minutes in produced a task
 * titled with the first eighty words of the call. The cue boundary is the
 * fallback: it is roughly clause-sized and always present.
 */
const SENTENCE_SPLIT = /(?<=[.!?])\s+|(?<=\.)\s*(?=[A-Z])/;

/** Longer than this and a "sentence" is really an unpunctuated turn. */
const RUN_ON_WORDS = 45;

/** A task title past this length is a run-on that slipped through. */
const MAX_TITLE_WORDS = 16;

/**
 * Cut from the promise forward.
 *
 * The old version assumed the sentence began with the promise and stripped
 * from the front, so a promise in the middle of a long turn produced a title
 * made of the words before it. Everything starts from the match now.
 */
function fromPromise(sentence: string): string | null {
  let earliest = -1;
  for (const rule of PROMISE) {
    const m = sentence.match(rule);
    if (m?.index !== undefined && (earliest === -1 || m.index < earliest)) {
      earliest = m.index;
    }
  }
  return earliest === -1 ? null : sentence.slice(earliest);
}

/** Reduce a spoken promise to something that reads as a task. */
export function toTaskTitle(sentence: string): string {
  let s = sentence.trim().replace(/\s+/g, " ");
  s = s.replace(OPENERS, "");

  // Strip the subject and the promise verb, leaving the action.
  s = s.replace(
    /^(?:i(?:'|’)?(?:ll|m)|i will|i am|i can|we(?:'|’)?ll|we will|we can|let me|i(?:'|’)?m going to|i am going to|i(?:'|’)?m gonna|we(?:'|’)?re going to|we(?:'|’)?re gonna)\s+/i,
    "",
  );
  s = s.replace(/^(?:going to|gonna|go ahead and|make sure (?:to|i)|try to|need to|have to|just)\s+/i, "");
  s = s.replace(HEDGES, "");

  // Trailing conversational tails. \b on both sides: without it the "ok"
  // alternative matches the tail of "playbook" and "I'll draft the SDR
  // playbook" becomes "Draft the SDR playbo".
  s = s.replace(
    /[,;]?\s+\b(?:if that (?:works|helps)|okay|ok|alright|does that (?:work|sound good)|sound good|for you|as well|too)\b\s*[.?!]*$/i,
    "",
  );
  // A promise that runs into the next thought keeps only the promise.
  s = s.replace(/\s+\b(?:and then|and also|but then|so then|and i|and we|so i|so we)\b.*$/i, "");
  s = s.replace(/[.!?,;:\s]+$/, "");

  if (s.length === 0) return sentence.trim().slice(0, 120);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const looksLikeCommitment = (sentence: string): boolean => {
  if (sentence.trim().endsWith("?")) return false;

  // An unpunctuated turn is not a sentence. Judging one finds a promise
  // somewhere in eighty words and titles the task with the wrong eighty.
  if (sentence.split(/\s+/).length > RUN_ON_WORDS) return false;

  if (!PROMISE.some((r) => r.test(sentence))) return false;
  if (NOT_A_PROMISE.some((r) => r.test(sentence))) return false;
  if (IN_CALL.some((r) => r.test(sentence))) return false;

  // The promise has to hand over a thing or move something outside the call.
  const action = fromPromise(sentence);
  if (!action || !ACTION.some((r) => r.test(action))) return false;

  // A promise needs an object. "I'll do it" is technically one and useless as
  // a task; three words of substance is the floor.
  const words = toTaskTitle(action).split(/\s+/).filter(Boolean);
  if (words.length < 3 || words.length > MAX_TITLE_WORDS) return false;

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

    for (const raw of utterances(turn.text)) {
      const sentence = raw.trim();
      if (sentence.length < 8 || !looksLikeCommitment(sentence)) continue;

      // Both the title and the quoted sentence start at the promise: the
      // words before it are context the person doesn't need and, when the
      // transcript is unpunctuated, are usually about something else.
      const said = fromPromise(sentence) ?? sentence;
      const suggestedTask = toTaskTitle(said);

      // The same promise repeated - restated, or confirmed at the end of the
      // call - is one task.
      const key = suggestedTask.toLowerCase().replace(/[^a-z0-9 ]/g, "");
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        text: said,
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
