/**
 * Finding the transcript among a recording's files.
 *
 * Zoom returns one recording as a list of files - video, audio, chat log,
 * timeline, and, if transcription was on, the words. Which key holds the
 * words depends on how the account is set up, and getting this wrong looks
 * exactly like the transcript not existing.
 */

export interface RecordingFileLike {
  file_type?: string;
  recording_type?: string;
  download_url?: string;
  status?: string;
}

export interface TranscriptPick {
  url: string | null;
  /** Zoom's audio transcript, or the closed captions as a stand-in. */
  kind: "transcript" | "captions" | null;
  /** Why there's nothing to read, in words that name the next move. */
  reason: string | null;
  /**
   * The file exists but Zoom is still producing it. Worth separating: this
   * one resolves on its own, so the call should be looked at again rather
   * than written off.
   */
  processing: boolean;
}

const is = (file: RecordingFileLike, recordingType: string, fileType: string) =>
  file.recording_type?.toLowerCase() === recordingType ||
  file.file_type?.toUpperCase() === fileType;

/**
 * Pick the transcript, and say what's there if there isn't one.
 *
 * Closed captions count. They're the same WebVTT with the same speaker
 * labels, produced by live transcription rather than by post-processing the
 * recording, and an account with captions on and audio transcript off has a
 * perfectly readable transcript that the narrow check missed entirely.
 */
export function pickTranscript(
  files: RecordingFileLike[] | undefined,
): TranscriptPick {
  const list = files ?? [];

  // Audio transcript first: it's produced from the finished recording and
  // its speaker attribution is better than live captioning's.
  const transcript = list.find((f) => is(f, "audio_transcript", "TRANSCRIPT"));
  const captions = list.find((f) => is(f, "closed_caption", "CC"));
  const chosen = transcript ?? captions;

  if (!chosen) {
    const had = [
      ...new Set(
        list
          .map((f) => f.file_type || f.recording_type || "")
          .filter(Boolean)
          .map((t) => t.toUpperCase()),
      ),
    ];
    return {
      url: null,
      kind: null,
      processing: false,
      reason: had.length
        ? `Zoom's recording for this call has ${had.join(", ")} and no transcript. Audio transcript has to be switched on in Zoom's cloud recording settings before the call - it can't be produced afterwards.`
        : "Zoom has a recording for this call but listed no files for it.",
    };
  }

  // Zoom reports a file before it has finished making it.
  const status = chosen.status?.toLowerCase();
  if (status && status !== "completed") {
    return {
      url: null,
      kind: null,
      processing: true,
      reason: `Zoom is still processing the transcript for this call (${chosen.status}). It'll be read on a later sync.`,
    };
  }

  if (!chosen.download_url) {
    return {
      url: null,
      kind: null,
      processing: true,
      reason:
        "Zoom listed a transcript for this call but gave no download link for it.",
    };
  }

  return {
    url: chosen.download_url,
    kind: transcript ? "transcript" : "captions",
    reason: null,
    processing: false,
  };
}

/**
 * Is this actually a transcript?
 *
 * Zoom answers an unauthenticated download with its sign-in page and HTTP
 * 200, so "the request succeeded" is not the same as "we have the words".
 * Every WebVTT file starts with the same six characters.
 */
export function looksLikeVtt(body: string): boolean {
  return /^﻿?\s*WEBVTT/i.test(body);
}
