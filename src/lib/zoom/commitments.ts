// Reading a Zoom transcript.
//
// This file used to lift promises out of transcripts, and later recap
// emails, with pattern rules - "I'll", "we'll", a verb from a list - and
// they were the main source of noise on My work. Claude reads both now, and
// what it can't read gets no action items rather than guessed ones. What's
// left is turning Zoom's VTT into speaker-labelled cues for Claude.

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
