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

/**
 * Go looking for the transcript, and print every answer verbatim.
 *
 * The recording list settled that the words aren't on the record itself.
 * This settles where they are, or that they aren't in the REST API at all —
 * which is a real answer too, and a cheaper one to get now than after a
 * sync has been written on the assumption that they are.
 */
export async function huntTranscriptAction(): Promise<OutreachState> {
  await requireAdmin();

  const { outreachConfigured, installId } = await import("@/lib/outreach/auth");
  if (!outreachConfigured() || !(await installId())) {
    return { error: "Outreach isn't connected yet." };
  }

  try {
    const { huntTranscript } = await import("@/lib/outreach/discover");
    const attempts = await huntTranscript();

    const lines: string[] = [];
    for (const a of attempts) {
      lines.push(`${a.status === 200 ? "✓" : "✗"} ${a.what}  HTTP ${a.status}`);
      lines.push(`    ${a.body}`);
      lines.push("");
    }
    return { ok: true, report: lines.join("\n") };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't reach Outreach." };
  }
}

/**
 * What Kaia recorded, against what OneSpace wrote up.
 *
 * The question that has gone unanswered all week is which calls are actually
 * broken. "No write-up" has been the answer for a call nobody recorded, a
 * call Zoom refused, and a call that simply hasn't been read yet — and only
 * one of those is a fault. Kaia knows independently which calls had a bot in
 * the room, so this lines the two lists up and gives a reason per call.
 */
export async function reconcileKaiaAction(): Promise<OutreachState> {
  await requireAdmin();

  const { outreachConfigured, installId } = await import("@/lib/outreach/auth");
  if (!outreachConfigured() || !(await installId())) {
    return { error: "Outreach isn't connected yet." };
  }

  try {
    const { recentSince, recentLabel } = await import("@/lib/recency");
    const { recentRecordings } = await import("@/lib/outreach/kaia");
    const { reconcile, tally } = await import("@/lib/outreach/reconcile");
    const { db } = await import("@/lib/db");

    const since = await recentSince();
    const window = await recentLabel();

    const [recordings, meetings] = await Promise.all([
      recentRecordings(since),
      db.meeting.findMany({
        where: { startsAt: { gte: new Date(since.getTime() - 86_400_000) } },
        select: {
          id: true,
          title: true,
          startsAt: true,
          googleId: true,
          zoomUuid: true,
          summary: true,
          transcriptNote: true,
          transcriptReadAt: true,
          user: { select: { name: true } },
        },
      }),
    ]);

    const lines = reconcile(
      recordings,
      meetings.map((m) => ({ ...m, ownerName: m.user.name })),
    );
    const counts = tally(lines);

    const out: string[] = [];
    out.push(
      `Kaia recorded ${recordings.length} call${
        recordings.length === 1 ? "" : "s"
      } ${window}.`,
    );
    out.push("");
    out.push(`  ${counts["written-up"]} have a write-up`);
    out.push(`  ${counts["never-read"]} haven't been read yet`);
    out.push(`  ${counts["read-failed"]} were read and refused`);
    out.push(`  ${counts["read-empty"]} were read and came back empty`);
    out.push(`  ${counts["no-meeting"]} aren't in OneSpace at all`);
    out.push("");

    // Worst first: a person looking at this wants the broken ones, and the
    // ones that worked are the least interesting rows on the page.
    const order = [
      "never-read",
      "read-failed",
      "no-meeting",
      "read-empty",
      "written-up",
    ] as const;

    for (const verdict of order) {
      const group = lines.filter((l) => l.verdict === verdict);
      if (group.length === 0) continue;
      out.push(`${verdict} (${group.length}):`);
      for (const line of group) {
        out.push(
          `  ${line.when.toISOString().slice(0, 16).replace("T", " ")}  ${line.title}${
            line.host ? ` · ${line.host}` : ""
          }`,
        );
        out.push(`      ${line.detail}`);
      }
      out.push("");
    }

    return { ok: true, report: out.join("\n") };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Couldn't reach Outreach." };
  }
}
