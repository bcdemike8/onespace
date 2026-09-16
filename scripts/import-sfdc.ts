/**
 * Load a Salesforce export from a folder, from your own machine.
 *
 *   npm run import:sfdc -- ~/Desktop/sfdc-export
 *
 * Why this exists rather than the page in the app: the browser route sends a
 * four-megabyte CSV through a server action and waits on one request. That is
 * two failure modes - the upload limit and the request timeout - and when it
 * breaks the page says "an unexpected response was received from the server",
 * which is the least informative sentence in software. Run from here, the
 * files never move, nothing times out, and a failure prints what actually
 * went wrong.
 *
 * It calls exactly the same import functions as the page, so the two cannot
 * drift apart.
 *
 * Options:
 *   --only=deals            run one step instead of all of them
 *   --from=contacts         start at a step and carry on
 *   --people=create         what to do about people who have left:
 *                           create (default) | none | their@email.address
 *   --columns               print each file's column names and stop, without
 *                           touching the database. Custom Salesforce fields
 *                           carry whatever API name somebody typed years ago,
 *                           and the export header is the only record of it -
 *                           so when a field arrives empty, this is how to
 *                           find out what it is really called.
 */

import "./load-env";
import { requireDatabaseUrl } from "./load-env";
import { requireCurrentClient } from "./check-generated-client";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { STEP_FILES, STEP_ORDER, type Step, type StepReport } from "@/lib/crm/import";
import * as importer from "@/lib/crm/import";
import { db } from "@/lib/db";

const args = process.argv.slice(2);
const flags = new Map<string, string>();
const positional: string[] = [];
for (const a of args) {
  const m = /^--([^=]+)=(.*)$/.exec(a);
  if (m) flags.set(m[1], m[2]);
  else if (a.startsWith("--")) flags.set(a.slice(2), "");
  else positional.push(a);
}

const folder = positional[0];

function die(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

if (!folder) {
  die(
    "Give me the folder your Salesforce CSVs are in.\n\n" +
      "  npm run import:sfdc -- ~/Desktop/sfdc-export",
  );
}
if (!existsSync(folder) || !statSync(folder).isDirectory()) {
  die(`There's no folder at ${folder}.`);
}
requireDatabaseUrl();
requireCurrentClient();

/**
 * Find the file for a step.
 *
 * Tolerant on purpose: exports come out as "Account.csv", and a trip through
 * Google Sheets turns them into "Account - Sheet1.csv". Matching on the stem
 * rather than the whole name saves a round of renaming.
 */
function findFile(base: string): string | null {
  const entries = readdirSync(folder!).filter((f) => f.toLowerCase().endsWith(".csv"));
  const want = base.toLowerCase();

  const exact = entries.find((f) => f.toLowerCase() === `${want}.csv`);
  if (exact) return join(folder!, exact);

  const starts = entries.find((f) => f.toLowerCase().startsWith(want));
  return starts ? join(folder!, starts) : null;
}

function read(base: string): string | null {
  const path = findFile(base);
  return path ? readFileSync(path, "utf8") : null;
}

function show(report: StepReport, file: string) {
  const bits = [
    `${report.rows.toLocaleString()} rows`,
    `${report.created.toLocaleString()} created`,
    `${report.updated.toLocaleString()} updated`,
  ];
  if (report.skipped) bits.push(`${report.skipped.toLocaleString()} skipped`);

  console.log(`\n${report.step.toUpperCase()}  (${file})`);
  console.log(`  ${bits.join(" · ")}`);
  for (const note of report.notes) console.log(`  → ${note}`);
}

async function runStep(step: Step, recordTypes?: string): Promise<boolean> {
  const base = STEP_FILES[step];
  const csv = read(base);

  if (!csv) {
    console.log(`\n${step.toUpperCase()}  — no ${base}.csv in that folder, skipping.`);
    return true;
  }

  const people = flags.get("people") ?? "create";
  const policy: importer.UnmatchedPeople =
    people === "none"
      ? { kind: "none" }
      : people === "create"
        ? { kind: "create" }
        : { kind: "assign", userId: people };

  try {
    const report =
      step === "people"
        ? await importer.importPeople(csv, policy)
        : step === "accounts"
          ? await importer.importAccounts(csv, recordTypes)
          : step === "products"
            ? await importer.importProducts(csv)
            : step === "contacts"
              ? await importer.importContacts(csv)
              : step === "deals"
                ? await importer.importDeals(csv, recordTypes)
                : step === "lines"
                  ? await importer.importLines(csv)
                  : await importer.importContactRoles(csv);

    show(report, `${base}.csv`);
    return true;
  } catch (e) {
    // The whole reason this script exists. Print everything.
    console.error(`\n${step.toUpperCase()} FAILED`);
    console.error(e);
    return false;
  }
}

async function main() {
  console.log(`Reading ${folder}`);

  const present = readdirSync(folder!).filter((f) => f.toLowerCase().endsWith(".csv"));
  console.log(`${present.length} CSV files found.`);

  if (flags.has("columns")) {
    for (const step of STEP_ORDER) {
      const base = STEP_FILES[step];
      const csv = read(base);
      if (!csv) {
        console.log(`\n${base}.csv — not in that folder.`);
        continue;
      }
      const header = csv.split("\n")[0] ?? "";
      const names = header
        .split(",")
        .map((c) => c.trim().replace(/^"|"$/g, ""))
        .filter(Boolean);
      console.log(`\n${base}.csv — ${names.length} columns`);
      console.log(names.map((n) => `  ${n}`).join("\n"));
    }
    await db.$disconnect();
    return;
  }

  const recordTypes = read("RecordType") ?? undefined;
  if (!recordTypes) {
    console.log(
      "No RecordType.csv — falling back to the record type ids from this org.",
    );
  }

  const only = flags.get("only") as Step | undefined;
  const from = flags.get("from") as Step | undefined;

  let steps = STEP_ORDER;
  if (only) {
    if (!STEP_ORDER.includes(only)) die(`Unknown step "${only}".`);
    steps = [only];
  } else if (from) {
    const at = STEP_ORDER.indexOf(from);
    if (at < 0) die(`Unknown step "${from}".`);
    steps = STEP_ORDER.slice(at);
  }

  for (const step of steps) {
    const ok = await runStep(step, recordTypes);
    if (!ok) {
      console.error(
        `\nStopped at ${step}. Nothing after it ran. Fix the above and run again — ` +
          `every step updates what's already there rather than duplicating it.`,
      );
      await db.$disconnect();
      process.exit(1);
    }
  }

  console.log("\nDone.");
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
