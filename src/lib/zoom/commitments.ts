// Reading a Zoom transcript, and the wording rules recap emails share.
//
// This file used to lift promises out of transcripts with pattern rules -
// "I'll", "we'll", a verb from a list - and they were the main source of
// noise on My work: "we'll want to create a custom field" read as a promise
// because it had a verb in it. Claude reads transcripts now, and a call it
// can't read gets no action items rather than guessed ones.
//
// What's left: turning Zoom's VTT into speaker-labelled cues for Claude, and
// the two pieces the recap-email rules in lib/mail/recap still use - telling
// a hedge from a commitment, and tidying a line into a task title.

export interface TranscriptCue {
  /** Seconds from the start of the call. */
  atSeconds: number;
  speaker: string | null;
  text: string;
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

// ------------------------------------------------------------------- rules

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
  // A plan or an idea, with nobody taking it on. "We'll want to create a
  // custom field", "we should look at the sequences".
  /\bwe(?:'|’)?(?:ll| will) (?:want|need) to\b/i,
  /\b(?:we|you) should\b/i,
];

/** Filler at the front of a spoken sentence, stripped for the task title. */
const OPENERS =
  /^(?:(?:yeah|yep|yes|no|okay|ok|alright|right|so|and|but|well|um+|uh+|like|i mean|actually|sure|great|perfect|awesome|cool|gotcha|absolutely|definitely|for sure|sounds good|no problem|of course)[,.]?\s+)+/i;

/** Hedges that shouldn't survive into a task title. */
const HEDGES =
  /^(?:(?:probably|maybe|likely|just|also|then|now|quickly|certainly|obviously|basically|honestly)\s+)+/i;

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
