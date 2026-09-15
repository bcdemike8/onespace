import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { SweepZoom } from "./SweepZoom";

export const dynamic = "force-dynamic";

/**
 * Why the calls have no write-ups — asked of Zoom rather than reasoned about.
 *
 * Every attempt at this so far has been a fix aimed at a guess, and each one
 * left the same sentence on the screen. This walks the pipeline in the order
 * it runs and prints what Zoom said at each step, so the failure is named
 * before anything else is changed.
 */
export default async function ZoomPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Zoom"
        subtitle="What Zoom has for every recent call, and where the write-up stops."
      />

      <div className="card p-4">
        <p className="mb-3 text-sm leading-relaxed text-ink-700">
          This asks four questions per call, in the order the sync asks them:
        </p>
        <ol className="mb-4 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-ink-600">
          <li>
            Is the account set to record to the cloud and transcribe? If it
            isn&apos;t, no change to OneSpace can produce a write-up, and
            everything below is noise.
          </li>
          <li>Did Zoom keep a recording of this call?</li>
          <li>
            Is there a transcript among its files — and if not, what is there
            instead?
          </li>
          <li>What does OneSpace hold, and what did it last say went wrong?</li>
        </ol>
        <SweepZoom />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        Nothing here changes anything. It reads Zoom and the meetings already
        stored, and writes nothing back.
      </p>
    </div>
  );
}
