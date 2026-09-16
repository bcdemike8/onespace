/**
 * What the CRM actually holds.
 *
 *   npm run crm:status
 *
 * Counts rather than pages: after an import the question is whether the
 * numbers match the export, and a list of 1,037 accounts doesn't answer it.
 * Reads nothing but totals and writes nothing at all.
 */

import { db } from "@/lib/db";

/** What the export contains, so the report can say more than a number. */
const EXPECTED = {
  clients: 1037,
  contacts: 7485,
  deals: 1269,
  won: 777,
  revenue: 5353925,
};

const mark = (actual: number, expected: number) =>
  actual === expected ? "✓" : actual === 0 ? "✗ nothing" : "~ differs";

async function main() {
  const [clients, contacts, deals, products, lines, roles, won, partners] =
    await Promise.all([
      db.client.count(),
      db.contact.count(),
      db.deal.count(),
      db.product.count(),
      db.dealProduct.count(),
      db.dealContactRole.count(),
      db.deal.aggregate({
        where: { isWon: true },
        _sum: { amount: true },
        _count: true,
      }),
      db.partner.count(),
    ]);

  const revenue = Math.round(Number(won._sum.amount ?? 0));

  console.log("\nWhat's in OneSpace\n");
  console.log(`  accounts       ${clients.toLocaleString().padStart(7)}   ${mark(clients, EXPECTED.clients)} (export has ${EXPECTED.clients.toLocaleString()})`);
  console.log(`  contacts       ${contacts.toLocaleString().padStart(7)}   ${mark(contacts, EXPECTED.contacts)} (export has ${EXPECTED.contacts.toLocaleString()})`);
  console.log(`  deals          ${deals.toLocaleString().padStart(7)}   ${mark(deals, EXPECTED.deals)} (export has ${EXPECTED.deals.toLocaleString()})`);
  console.log(`  products       ${products.toLocaleString().padStart(7)}`);
  console.log(`  deal products  ${lines.toLocaleString().padStart(7)}`);
  console.log(`  contact roles  ${roles.toLocaleString().padStart(7)}`);
  console.log(`  partners       ${partners.toLocaleString().padStart(7)}`);

  console.log(`\n  won            ${won._count.toLocaleString().padStart(7)}   ${mark(won._count, EXPECTED.won)}`);
  console.log(`  revenue        ${("$" + revenue.toLocaleString()).padStart(7)}   ${mark(revenue, EXPECTED.revenue)} (export totals $${EXPECTED.revenue.toLocaleString()})`);

  if (deals === 0) {
    console.log("\n  No deals at all. Run:  npm run import:sfdc -- <folder> --only=deals");
    await db.$disconnect();
    return;
  }

  // Which of the fields that were added late actually landed. A deal row
  // exists either way; these say whether it is the full record.
  const [ae, owner, probability, forecast, roleCount, consultant] = await Promise.all([
    db.deal.count({ where: { partnerAeId: { not: null } } }),
    db.deal.count({ where: { ownerId: { not: null } } }),
    db.deal.count({ where: { probability: { not: null } } }),
    db.deal.count({ where: { forecastCategory: { not: null } } }),
    db.deal.count({ where: { contactRoles: { some: {} } } }),
    db.deal.count({ where: { leadConsultantId: { not: null } } }),
  ]);

  const pct = (n: number) => `${Math.round((n / deals) * 100)}%`;
  console.log("\n  On the deals themselves");
  console.log(`    owner              ${String(owner).padStart(5)}  ${pct(owner)}   (export: 100%)`);
  console.log(`    partner AE         ${String(ae).padStart(5)}  ${pct(ae)}   (export: 60%)`);
  console.log(`    probability        ${String(probability).padStart(5)}  ${pct(probability)}   (export: 100%)`);
  console.log(`    forecast category  ${String(forecast).padStart(5)}  ${pct(forecast)}   (export: 100%)`);
  console.log(`    lead consultant    ${String(consultant).padStart(5)}  ${pct(consultant)}   (export: 22%)`);
  console.log(`    contact roles      ${String(roleCount).padStart(5)}  ${pct(roleCount)}`);

  console.log(
    "\n  A percentage well under the export's means that step needs running again.\n",
  );

  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
