/**
 * Make the partner table say what the business says.
 *
 *   npm run crm:platforms            what it would do, and nothing else
 *   npm run crm:platforms -- --apply actually do it
 *
 * Three things:
 *
 *   1. Rename a platform written under an older spelling - Salesforce's
 *      "Outreach" to "Outreach.io", "ZoomInfo (SL)" to "ZoomInfo". A rename
 *      keeps every deal pointing at it, which is why it is a rename and not
 *      a create-and-repoint.
 *   2. Create any platform that isn't there yet.
 *   3. Archive every partner row that isn't a platform. The Asana import
 *      created one for each value it found in a "Partner" column, which is
 *      how "Association for Talent Development" and "Murdoch Marketing"
 *      ended up being offered as platforms to filter deals by.
 *
 * Archive, never delete: a row still attached to a project or a client keeps
 * its relations and simply stops being offered. Nothing here loses data, and
 * running it twice does nothing the second time.
 */

import "./load-env";
import { requireDatabaseUrl } from "./load-env";
import { requireCurrentClient } from "./check-generated-client";
import { db } from "@/lib/db";
import { PLATFORM_NAMES, platformFor } from "@/lib/crm/platforms";

const apply = process.argv.includes("--apply");

async function main() {
  requireDatabaseUrl();
  requireCurrentClient();

  const partners = await db.partner.findMany({
    select: { id: true, name: true, archivedAt: true },
    orderBy: { name: "asc" },
  });

  // What each row is attached to, so the report can say what archiving costs
  // before anybody decides.
  const usage = new Map<string, { deals: number; clients: number; projects: number }>();
  for (const p of partners) {
    const [deals, clients, projects] = await Promise.all([
      db.deal.count({ where: { partnerId: p.id } }),
      db.client.count({ where: { partnerId: p.id } }),
      db.project.count({ where: { partnerId: p.id } }),
    ]);
    usage.set(p.id, { deals, clients, projects });
  }

  const renames: { id: string; from: string; to: string }[] = [];
  const archives: { id: string; name: string }[] = [];
  const keep = new Set<string>();

  for (const p of partners) {
    const canonical = platformFor(p.name);
    if (canonical) {
      keep.add(canonical);
      if (p.name !== canonical) renames.push({ id: p.id, from: p.name, to: canonical });
      continue;
    }
    if (!p.archivedAt) archives.push({ id: p.id, name: p.name });
  }

  const creates = PLATFORM_NAMES.filter((n) => !keep.has(n));

  console.log(`\n${partners.length} partner rows.\n`);

  if (renames.length === 0 && creates.length === 0 && archives.length === 0) {
    console.log("Already exactly the six platforms. Nothing to do.\n");
    await db.$disconnect();
    return;
  }

  if (renames.length) {
    console.log("Rename (every deal pointing at these keeps pointing at them):");
    for (const r of renames) {
      const u = usage.get(r.id)!;
      console.log(`  ${r.from}  →  ${r.to}   ${u.deals} deals, ${u.clients} accounts`);
    }
    console.log("");
  }

  if (creates.length) {
    console.log(`Create: ${creates.join(", ")}\n`);
  }

  if (archives.length) {
    console.log("Archive (kept, with their relations, just no longer offered):");
    for (const a of archives) {
      const u = usage.get(a.id)!;
      const attached = [
        u.deals ? `${u.deals} deals` : null,
        u.clients ? `${u.clients} accounts` : null,
        u.projects ? `${u.projects} projects` : null,
      ].filter(Boolean);
      console.log(
        `  ${a.name.padEnd(40)} ${attached.length ? attached.join(", ") : "nothing attached"}`,
      );
    }
    console.log("");
  }

  // Anything with deals on it is worth saying out loud rather than burying in
  // the list: archiving it hides a platform some deals still claim.
  const withDeals = archives.filter((a) => usage.get(a.id)!.deals > 0);
  if (withDeals.length) {
    console.log(
      `${withDeals.length} of those still have deals pointing at them. Those deals keep\n` +
        `their value and stay visible; they just won't be filterable by it. Worth a look\n` +
        `before applying: ${withDeals.map((a) => a.name).join(", ")}\n`,
    );
  }

  if (!apply) {
    console.log("Nothing changed. Run again with --apply to do it.\n");
    await db.$disconnect();
    return;
  }

  for (const r of renames) {
    await db.partner.update({ where: { id: r.id }, data: { name: r.to } });
  }
  for (const name of creates) {
    await db.partner.create({ data: { name } });
  }
  for (const a of archives) {
    await db.partner.update({ where: { id: a.id }, data: { archivedAt: new Date() } });
  }

  console.log(
    `Done: ${renames.length} renamed, ${creates.length} created, ${archives.length} archived.\n`,
  );
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
