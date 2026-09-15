"use server";

import { requireAdmin } from "@/lib/auth";

export type OutreachState = { error?: string; ok?: boolean; report?: string };

/**
 * Ask Outreach what it will actually give us, and print it.
 *
 * Admin-only: it reads a sample of real call records across the whole
 * organisation, which is well beyond anyone's own work.
 */
export async function discoverOutreachAction(): Promise<OutreachState> {
  await requireAdmin();

  const { outreachConfigured, installId } = await import("@/lib/outreach/auth");

  if (!outreachConfigured()) {
    return {
      error:
        "Outreach isn't connected on this service. Set OUTREACH_S2S_GUID (or S2S_GUID) and OUTREACH_PRIVATE_KEY in Railway on the app service, then redeploy.",
    };
  }

  if (!(await installId())) {
    return {
      error:
        "The app has the key but hasn't been installed into the Outreach organisation yet, so there's no installation to read from. Install it from the Outreach developer portal with the setup URL below.",
    };
  }

  try {
    const { discoverOutreach } = await import("@/lib/outreach/discover");
    const { transcriptCandidates } = await import("@/lib/outreach/shape");
    const probes = await discoverOutreach();

    const lines: string[] = [];

    for (const p of probes) {
      lines.push(
        `${p.ok ? "✓" : "✗"} ${p.path}${p.status ? `  HTTP ${p.status}` : ""}${
          p.count !== undefined ? `  ${p.count} record(s)` : ""
        }`,
      );
      if (p.note) lines.push(`    ${p.note}`);

      if (p.fields?.length) {
        const likely = transcriptCandidates(p.fields);
        if (likely.length) {
          lines.push(`    Might hold what was said: ${likely.join(", ")}`);
        }
        lines.push("    Fields:");
        for (const f of p.fields) {
          lines.push(
            `      ${f.name}  ${f.type}${f.sample ? `  ${f.sample}` : ""}`,
          );
        }
      }
      if (p.relationships?.length) {
        lines.push(`    Links to: ${p.relationships.join(", ")}`);
      }
      lines.push("");
    }

    lines.push(
      "Values are cut to 100 characters — enough to recognise a field, not a copy of the call.",
    );

    return { ok: true, report: lines.join("\n") };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Couldn't reach Outreach.",
    };
  }
}
