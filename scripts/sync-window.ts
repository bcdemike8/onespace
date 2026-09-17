/**
 * How far back the syncs reach, and changing it.
 *
 *   npm run sync:window                          show all three
 *   npm run sync:window -- --set=2026-08-31      all three, from that day
 *   npm run sync:window -- --calendar=2026-08-31
 *   npm run sync:window -- --zoom=2026-08-31
 *   npm run sync:window -- --writeups=7          rolling, seven days
 *
 * Three windows, because they cost different things:
 *
 *   calendar  which meetings appear at all. Cheap - it is one Google call
 *             per person per run.
 *   zoom      which calls are looked at. Also cheap.
 *   writeups  which calls get read and summarised. This one spends money
 *             and time: every call in the window is a transcript fetched
 *             and sent to Claude. It is the one to keep short if you don't
 *             want the whole backlog written up.
 *
 * Each takes either a date - 2026-08-31, fixed, stays where you put it - or
 * a number of days - 7, rolling, always means the last week. Nothing here
 * deletes anything: widening a window means the next sync sees more, and
 * narrowing it means it sees less. Meetings already stored stay stored.
 *
 * After changing these, run the syncs: Meetings → Sync calendars, and
 * Zoom → Sync Zoom. A big backfill of write-ups may need a few runs, because
 * each one stops before it times out and picks up where it left off.
 */

import "./load-env";
import { requireDatabaseUrl } from "./load-env";
import { requireCurrentClient } from "./check-generated-client";
import { db } from "@/lib/db";
import {
  DEFAULT_SYNC_FROM,
  WINDOW_KEYS,
  labelOf,
  parseWindow,
  sinceOf,
} from "@/lib/window";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const at = hit.indexOf("=");
  return at === -1 ? "" : hit.slice(at + 1).trim();
};

const WINDOWS = [
  {
    name: "calendar",
    key: WINDOW_KEYS.calendar,
    what: "which meetings appear at all",
  },
  {
    name: "zoom",
    key: WINDOW_KEYS.zoom,
    what: "which Zoom calls are looked at",
  },
  {
    name: "writeups",
    key: WINDOW_KEYS.writeups,
    what: "which calls get read and summarised — this one costs money",
  },
] as const;

/**
 * Is this something lib/window will actually accept?
 *
 * parseWindow falls back rather than throwing, which is right for a sync at
 * 5am and wrong here: somebody typing 31/08/2026 should be told, not quietly
 * given 31 August by way of the default.
 */
function accepted(value: string): boolean {
  const asGiven = labelOf(parseWindow(value, "__never__"));
  const fallback = labelOf(parseWindow("", "__never__"));
  return asGiven !== fallback || value.trim() === DEFAULT_SYNC_FROM;
}

async function main() {
  requireDatabaseUrl();
  requireCurrentClient();

  const all = flag("set");
  const wanted = new Map<string, string>();
  for (const w of WINDOWS) {
    const given = flag(w.name) ?? all;
    if (given !== undefined) wanted.set(w.name, given);
  }

  for (const [name, value] of wanted) {
    if (!accepted(value)) {
      console.log(
        `\n"${value}" isn't a window I can use for --${name}.\n\n` +
          "Give a date as 2026-08-31, or a number of days as 7.\n",
      );
      await db.$disconnect();
      process.exit(1);
    }
  }

  const rows = await db.appSetting.findMany({
    where: { key: { in: WINDOWS.map((w) => w.key) } },
  });
  const stored = new Map(rows.map((r) => [r.key, r.value]));

  console.log("");
  for (const w of WINDOWS) {
    const before = parseWindow(stored.get(w.key));
    const set = wanted.get(w.name);

    if (set === undefined) {
      console.log(
        `  ${w.name.padEnd(9)} ${labelOf(before).padEnd(26)} ${
          stored.has(w.key) ? "" : "(the default)"
        }`,
      );
      console.log(`  ${" ".repeat(9)} ${w.what}\n`);
      continue;
    }

    await db.appSetting.upsert({
      where: { key: w.key },
      create: { key: w.key, value: set },
      update: { value: set },
    });

    const after = parseWindow(set);
    const was = sinceOf(before).getTime();
    const now = sinceOf(after).getTime();
    const change = now === was ? "unchanged" : now < was ? "wider" : "narrower";
    console.log(
      labelOf(before) === labelOf(after)
        ? `  ${w.name.padEnd(9)} ${labelOf(after)}  (already was)`
        : `  ${w.name.padEnd(9)} ${labelOf(before)} → ${labelOf(after)}  (${change})`,
    );
    console.log(`  ${" ".repeat(9)} ${w.what}\n`);
  }

  if (wanted.size === 0) {
    console.log(
      "Nothing changed. To move all three to the same day:\n\n" +
        "  npm run sync:window -- --set=2026-08-31\n\n" +
        "Or one at a time, with --calendar=, --zoom= or --writeups=.\n" +
        "A number instead of a date means a rolling window: --writeups=7.\n",
    );
  } else {
    console.log(
      "Saved. Nothing has synced yet — these only say what the next run will\n" +
        "look at. Open OneSpace and press Sync calendars on Meetings, then\n" +
        "Sync Zoom on the Zoom page.\n\n" +
        "A wide write-up window can take a few runs: each one stops before it\n" +
        "times out and the next picks up where it left off.\n",
    );
  }

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
