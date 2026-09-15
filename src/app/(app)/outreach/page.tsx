import { requireAdmin } from "@/lib/auth";
import { appUrl } from "@/lib/app-url";
import { installId, outreachConfigured, s2sGuid } from "@/lib/outreach/auth";
import { PageHeader } from "@/components/ui";
import { DiscoverOutreach } from "./DiscoverOutreach";

export const dynamic = "force-dynamic";

/**
 * The state of the Outreach connection, and the one question it exists to
 * answer.
 *
 * Kaia is meant to replace Zoom as where call write-ups come from, and the
 * thing that decides whether it can is whether a kaiaRecording carries the
 * words people said or only a link to a recording. Nobody has published that
 * attribute list, so it gets asked rather than assumed - the same order this
 * project has had to learn twice already.
 */
export default async function OutreachPage() {
  await requireAdmin();

  const configured = outreachConfigured();
  const install = configured ? await installId() : null;
  const setupUrl = `${appUrl()}/api/outreach/install`;

  const steps: Array<{ done: boolean; label: string; detail: string }> = [
    {
      done: Boolean(s2sGuid()),
      label: "S2S GUID",
      detail: s2sGuid()
        ? `Set (${s2sGuid().slice(0, 8)}…)`
        : "Not set. Add OUTREACH_S2S_GUID in Railway.",
    },
    {
      done: configured,
      label: "Private key",
      detail: configured
        ? "Set"
        : "Not set. Add OUTREACH_PRIVATE_KEY in Railway — the whole PEM file, BEGIN and END lines included.",
    },
    {
      done: Boolean(install),
      label: "Installed in Outreach",
      detail: install
        ? `Installation ${install}`
        : "Not yet. Install the app in Outreach with the setup URL below.",
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Outreach"
        subtitle="Kaia call recordings, and whether they can be read from here."
      />

      <ol className="card mb-4 divide-y divide-ink-100">
        {steps.map((s) => (
          <li key={s.label} className="flex items-baseline gap-3 px-4 py-3">
            <span
              aria-hidden="true"
              className={`text-sm ${s.done ? "text-brand-600" : "text-ink-300"}`}
            >
              {s.done ? "●" : "○"}
            </span>
            <span className="w-40 shrink-0 text-sm font-medium text-ink-900">
              {s.label}
            </span>
            <span className="text-sm text-ink-600">{s.detail}</span>
          </li>
        ))}
      </ol>

      <div className="card mb-4 p-4">
        <h2 className="mb-1 text-sm font-medium text-ink-900">Setup URL</h2>
        <p className="mb-2 text-sm leading-relaxed text-ink-600">
          In the Outreach developer portal, under the app&apos;s installation
          settings, set the external configuration setup URL to this. Outreach
          sends the browser here once the app is installed, carrying a token
          that&apos;s good for fifteen minutes — this page catches it and saves
          the installation.
        </p>
        <code className="block overflow-x-auto rounded-lg bg-ink-50 px-3 py-2 text-xs text-ink-800">
          {setupUrl}
        </code>
      </div>

      <div className="card mb-4 p-4">
        <h2 className="mb-1 text-sm font-medium text-ink-900">
          Every recorded call, and why it has no write-up
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-ink-700">
          Kaia knows which calls had a bot in the room, independently of Zoom.
          This lines that list up against what OneSpace holds and gives a
          reason per call — so &ldquo;no write-up&rdquo; stops covering a call
          nobody recorded, a call Zoom refused, and a call nothing has read
          yet, which need three different fixes.
        </p>
        <DiscoverOutreach job="reconcile" />
      </div>

      <div className="card p-4">
        <h2 className="mb-1 text-sm font-medium text-ink-900">
          What the API exposes
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-ink-700">
          This reads two records from each of a handful of endpoints and prints
          what came back — the field names, their types, and the first hundred
          characters of each. It writes nothing.
        </p>
        <DiscoverOutreach />
      </div>

      <div className="card mt-4 p-4">
        <h2 className="mb-1 text-sm font-medium text-ink-900">
          Where is the transcript?
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-ink-700">
          A Kaia recording carries the call&apos;s shape — who was on it, how
          long it ran, a link to the player — but not a word of what was said.
          This asks Outreach where the words are: as a relationship on the
          recording, as a resource of their own, or not in the REST API at all.
          The last is a real answer too, and cheaper to have now than after a
          sync has been written on the assumption it isn&apos;t.
        </p>
        <DiscoverOutreach job="hunt" />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        Answered, and the answer was no: a Kaia recording has exactly three
        relationships — account, opportunity and owner — and there is no
        transcript resource anywhere in the REST API. The words stay in Zoom,
        which is where OneSpace reads them from. What Kaia is good for is
        knowing which calls were actually recorded, which is the panel below.
      </p>
    </div>
  );
}
