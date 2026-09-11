import "server-only";
import {
  getMeetingSummary,
  getRecording,
  zoomDownload,
  ZoomError,
} from "@/lib/zoom/client";
import { pickTranscript } from "@/lib/zoom/files";
import { aiConfigured } from "@/lib/ai/summarise";

/**
 * What Zoom actually has for one call, in plain sentences.
 *
 * Every step of the path the sync takes, reported whether it worked or not.
 * The point is to end the round trip where the app says "no transcript",
 * the person says "but I can see one", and neither statement contains the
 * thing that would settle it.
 */
export async function describeZoomCall(uuid: string): Promise<string> {
  const lines: string[] = [];

  // ------------------------------------------------------- the recording
  let files: { file_type?: string; recording_type?: string; status?: string; download_url?: string }[] = [];
  // Distinguished from "a recording with no files in it": when the request
  // itself failed there is nothing to say about a transcript, and saying it
  // anyway contradicts the line above.
  let asked = false;
  try {
    const rec = await getRecording(uuid);
    if (!rec) {
      lines.push(
        "Recording: Zoom has none for this call. It was either not recorded, recorded to the laptop rather than the cloud, or the recording has passed Zoom's retention window.",
      );
    } else {
      asked = true;
      files = rec.recording_files ?? [];
      lines.push(
        `Recording: found, ${files.length} file${files.length === 1 ? "" : "s"} — ${
          files
            .map(
              (f) =>
                `${f.file_type || f.recording_type || "?"}${
                  f.status && f.status.toLowerCase() !== "completed" ? ` (${f.status})` : ""
                }`,
            )
            .join(", ") || "none listed"
        }.`,
      );
    }
  } catch (e) {
    lines.push(
      `Recording: Zoom refused the request. ${e instanceof ZoomError ? e.message : "Unknown error."}`,
    );
  }

  // ------------------------------------------------------- the transcript
  const pick = asked ? pickTranscript(files) : null;
  if (!pick) {
    // Nothing to add: either there's no recording or Zoom wouldn't say.
  } else if (!pick.url) {
    lines.push(`Transcript: ${pick.reason ?? "none."}`);
  } else {
    lines.push(
      `Transcript: found, as ${pick.kind === "captions" ? "closed captions" : "an audio transcript"}.`,
    );
    const file = await zoomDownload(pick.url);
    lines.push(
      file.text
        ? `Download: worked, ${file.text.length.toLocaleString()} characters. This call can be summarised — run Sync Zoom.`
        : `Download: failed. ${file.reason}`,
    );
  }

  // -------------------------------------------------------- AI Companion
  try {
    const summary = await getMeetingSummary(uuid);
    lines.push(
      !summary
        ? "AI Companion: no summary for this call."
        : `AI Companion: a summary with ${summary.next_steps?.length ?? 0} next step${
            (summary.next_steps?.length ?? 0) === 1 ? "" : "s"
          }.`,
    );
  } catch (e) {
    lines.push(
      `AI Companion: ${e instanceof ZoomError ? e.message : "couldn't be read."}`,
    );
  }

  // Last, because it's about this service rather than about the call - but
  // it is the difference between a write-up and a list of scraped sentences,
  // and it is invisible from every other screen.
  lines.push(
    aiConfigured()
      ? "Claude: connected."
      : "Claude: not connected on this service. ANTHROPIC_API_KEY needs to be set in Railway on the app service and the cron service both - a transcript still gets read, but by the old pattern rules, and no write-up is stored.",
  );

  return lines.join(" ");
}
