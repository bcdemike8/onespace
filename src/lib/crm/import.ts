// Not marked server-only, because this is also run straight from a terminal
// by scripts/import-sfdc.ts - which is how a 4MB file gets loaded without
// going through a server action, and how a failure prints a real error
// instead of "an unexpected response was received from the server".
//
// The guard is not lost: everything here reaches for @/lib/db, and
// check:client fails the build if a client component imports any of it.
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseSheet } from "@/lib/csv";
import { planAccounts } from "@/lib/crm/plan";
import {
  idKey,
  mapAccount,
  mapContact,
  mapDeal,
  mapLine,
  mapProduct,
  recordTypes,
  text,
  userEmails,
  type RecordTypes,
} from "@/lib/crm/sfdc";

/**
 * The Salesforce export, loaded into OneSpace.
 *
 * One object at a time, each step independent and re-runnable. Independent
 * because a single request that loads 1,037 accounts, 7,485 contacts and
 * 1,269 deals is exactly the shape of request that gets cut off halfway by
 * something in between - and a half-finished import is worse than none.
 * Re-runnable because the first attempt at a mapping is never the last, and
 * fixing one should cost a click rather than a database clean-up.
 *
 * Relationships resolve through sfdcId, which every row carries. That is
 * what makes the steps independent: contacts find their accounts by asking
 * the database, not by holding state from an earlier step.
 */

export type Step =
  | "people"
  | "accounts"
  | "products"
  | "contacts"
  | "deals"
  | "lines"
  | "roles";

export interface StepReport {
  step: Step;
  rows: number;
  created: number;
  updated: number;
  skipped: number;
  /// Things that need a person to look at them, named rather than counted.
  notes: string[];
}

/** Where the Salesforce user map lives between steps. */
const USER_MAP_KEY = "crm.sfdcUserMap";

const chunk = <T,>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/** Run a list of writes a few at a time, rather than 7,000 at once. */
async function inBatches<T>(items: T[], size: number, run: (item: T) => Promise<unknown>) {
  for (const group of chunk(items, size)) {
    await Promise.all(group.map(run));
  }
}

async function sfdcUserMap(): Promise<Map<string, string>> {
  const row = await db.appSetting.findUnique({ where: { key: USER_MAP_KEY } });
  if (!row?.value) return new Map();
  try {
    return new Map(Object.entries(JSON.parse(row.value) as Record<string, string>));
  } catch {
    return new Map();
  }
}

// ------------------------------------------------------------------- 0. people

/**
 * Salesforce users to OneSpace people, by email.
 *
 * Email is the only thing the two systems genuinely agree on. The export
 * holds eight real people alongside a dozen integration users - Automated
 * Process, Chatter Expert, a Salesloft connector - which match nobody, and
 * are meant not to.
 */
/**
 * What to do about a Salesforce user OneSpace has never heard of.
 *
 * Three of them here are people who have left - and between them they own
 * several hundred deals and created most of the contacts. Dropping their
 * ownership loses real history; reassigning it to whoever is still here
 * rewrites it. Which of those is the lesser loss is not a decision the
 * import gets to make on its own.
 */
export type UnmatchedPeople =
  /** Create them as inactive people: history intact, no way in, no clutter. */
  | { kind: "create" }
  /** Give everything they owned to somebody who is still here. */
  | { kind: "assign"; userId: string }
  /** Leave those records unowned. */
  | { kind: "none" };

/** A real colleague, as opposed to Salesforce's own integration accounts. */
const INTEGRATION = /salesforce\.com|@00d|example\.com|\.ext$|^autoproc|^sfdcadmin/i;

export async function importPeople(
  csv: string,
  unmatchedPolicy: UnmatchedPeople = { kind: "none" },
): Promise<StepReport> {
  const { rows } = parseSheet(csv);
  const emails = userEmails(rows);

  // Names too, so anyone created reads as a person rather than an address.
  const names = new Map<string, string>();
  for (const row of rows) {
    const key = (row.Id ?? "").trim().slice(0, 15);
    const name = [row.FirstName, row.LastName]
      .map((v) => (v ?? "").trim())
      .filter(Boolean)
      .join(" ");
    if (key && name) names.set(key, name);
  }

  const people = await db.user.findMany({ select: { id: true, email: true } });
  const byEmail = new Map(people.map((p) => [p.email.toLowerCase(), p.id]));

  const map: Record<string, string> = {};
  const unmatched: { sfdcId: string; email: string }[] = [];

  for (const [sfdcId, email] of emails) {
    const userId = byEmail.get(email);
    if (userId) map[sfdcId] = userId;
    else unmatched.push({ sfdcId, email });
  }

  const real = unmatched.filter((u) => !INTEGRATION.test(u.email));
  const notes: string[] = [];
  let created = 0;

  if (real.length && unmatchedPolicy.kind === "create") {
    for (const u of real) {
      const row = await db.user.upsert({
        where: { email: u.email },
        create: {
          email: u.email,
          name: names.get(u.sfdcId) ?? u.email,
          // Never a valid hash, and verifyPassword refuses anything that
          // isn't scrypt$salt$hash - so there is no password to guess.
          passwordHash: "disabled",
          isActive: false,
        },
        update: {},
        select: { id: true },
      });
      map[u.sfdcId] = row.id;
      created++;
    }
    notes.push(
      `Added ${created} former ${created === 1 ? "colleague" : "colleagues"} as inactive people so their deals and contacts keep the right owner: ${real
        .map((u) => u.email)
        .join(", ")}. They can't sign in and won't appear as assignees.`,
    );
  } else if (real.length && unmatchedPolicy.kind === "assign") {
    const owner = await db.user.findUnique({
      where: { id: unmatchedPolicy.userId },
      select: { id: true, name: true },
    });
    if (!owner) return { step: "people", rows: rows.length, created: 0, updated: 0, skipped: 0, notes: ["That person no longer exists in OneSpace."] };

    for (const u of real) map[u.sfdcId] = owner.id;
    notes.push(
      `Records owned by ${real.map((u) => u.email).join(", ")} will be assigned to ${owner.name}. Salesforce's own record of who owned them is not kept.`,
    );
  } else if (real.length) {
    notes.push(
      `No OneSpace account for: ${real.map((u) => u.email).join(", ")}. Their records will import with no owner. Re-run this step with a different choice above if you'd rather they were kept.`,
    );
  }

  await db.appSetting.upsert({
    where: { key: USER_MAP_KEY },
    create: { key: USER_MAP_KEY, value: JSON.stringify(map) },
    update: { value: JSON.stringify(map) },
  });

  return {
    step: "people",
    rows: rows.length,
    created,
    updated: Object.keys(map).length - created,
    skipped: rows.length - Object.keys(map).length,
    notes,
  };
}

// ----------------------------------------------------------------- 1. accounts

export async function importAccounts(
  csv: string,
  recordTypeCsv?: string,
): Promise<StepReport> {
  const { rows } = parseSheet(csv);
  const types: RecordTypes = recordTypes(
    recordTypeCsv ? parseSheet(recordTypeCsv).rows : [],
  );
  const users = await sfdcUserMap();

  const existing = await db.client.findMany({
    select: { id: true, sfdcId: true, name: true },
  });
  const partners = await ensurePartners(rows.map((r) => r.Type));

  // Decided first, written second. See planAccounts: this used to write one
  // row at a time inside the loop, which is 1,037 round trips to a database
  // in another data centre - over a minute, and long enough that the request
  // was cut off before it finished. The work was correct and nobody ever saw
  // the result.
  const plan = planAccounts(
    rows.map((raw) => mapAccount(raw, types)),
    existing,
    (a) => ({
      accountType: a.accountType,
      legalName: a.legalName,
      website: a.website,
      phone: a.phone,
      linkedinUrl: a.linkedinUrl,
      description: a.description,
      industry: a.industry,
      employees: a.employees,
      annualRevenue: a.annualRevenue,
      street: a.street,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country,
      teamSize: a.teamSize,
      xdrSize: a.xdrSize,
      salesRoles: a.salesRoles,
      technologyUsed: a.technologyUsed,
      ownerId: a.ownerKey ? (users.get(a.ownerKey) ?? null) : null,
      partnerId: a.platform ? (partners.get(a.platform) ?? null) : null,
      firstSeenAt: a.firstSeenAt,
    }),
  );

  const creates = plan.creates as unknown as Prisma.ClientCreateManyInput[];
  const updates = plan.updates as unknown as {
    id: string;
    data: Prisma.ClientUpdateInput;
  }[];
  const notes = plan.notes;
  const skipped = plan.skipped;

  let created = 0;
  for (const group of chunk(creates, 500)) {
    const result = await db.client.createMany({ data: group, skipDuplicates: true });
    created += result.count;
  }

  // Updates have different values per row, so there is no single statement
  // for them - but twenty at a time is seconds rather than minutes.
  await inBatches(updates, 20, async (u) => {
    await db.client.update({ where: { id: u.id }, data: u.data });
  });

  return {
    step: "accounts",
    rows: rows.length,
    created,
    updated: updates.length,
    skipped,
    notes,
  };
}

/** Outreach, Salesloft, Apollo — as Partner rows, which already exist here. */
async function ensurePartners(values: (string | undefined)[]): Promise<Map<string, string>> {
  const { splitType } = await import("@/lib/crm/sfdc");
  const names = new Set<string>();
  for (const v of values) {
    const p = splitType(v).platform;
    if (p) names.add(p);
  }

  const out = new Map<string, string>();
  for (const name of names) {
    const row = await db.partner.upsert({
      where: { name },
      create: { name },
      update: {},
      select: { id: true },
    });
    out.set(name, row.id);
  }
  return out;
}

// ----------------------------------------------------------------- 2. products

export async function importProducts(csv: string): Promise<StepReport> {
  const { rows } = parseSheet(csv);

  // Read the catalogue once rather than asking about each product in turn.
  const existing = await db.product.findMany({
    select: { id: true, sfdcId: true, name: true },
  });
  const bySfdc = new Map(existing.filter((p) => p.sfdcId).map((p) => [p.sfdcId!, p.id]));
  const byName = new Map(existing.map((p) => [p.name.toLowerCase(), p.id]));

  const creates: Prisma.ProductCreateManyInput[] = [];
  const updates: { id: string; data: Prisma.ProductUpdateInput }[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const raw of rows) {
    const p = mapProduct(raw);
    if (!p) {
      skipped++;
      continue;
    }

    const data = {
      name: p.name,
      description: p.description,
      family: p.family,
      delivery: p.delivery,
      sowUrl: p.sowUrl,
      active: p.active,
      sfdcId: p.sfdcId,
    };

    const known = bySfdc.get(p.sfdcId) ?? byName.get(p.name.toLowerCase());
    if (known) {
      updates.push({ id: known, data });
      continue;
    }

    // Product names are unique, and a catalogue can list the same thing
    // twice. Take the first and count the rest as skipped rather than
    // letting the insert fail.
    if (seen.has(p.name.toLowerCase())) {
      skipped++;
      continue;
    }
    seen.add(p.name.toLowerCase());
    creates.push(data);
  }

  let created = 0;
  for (const group of chunk(creates, 500)) {
    const result = await db.product.createMany({ data: group, skipDuplicates: true });
    created += result.count;
  }
  await inBatches(updates, 20, async (u) => {
    await db.product.update({ where: { id: u.id }, data: u.data });
  });

  const withSow = rows.filter((r) => text(r.SOW_URL__c)).length;
  return {
    step: "products",
    rows: rows.length,
    created,
    updated: updates.length,
    skipped,
    notes: withSow
      ? [`${withSow} products carry a statement-of-work link.`]
      : [],
  };
}

// ----------------------------------------------------------------- 3. contacts

export async function importContacts(csv: string): Promise<StepReport> {
  const { rows } = parseSheet(csv);
  const users = await sfdcUserMap();

  const [clients, contacts] = await Promise.all([
    db.client.findMany({
      where: { sfdcId: { not: null } },
      select: { id: true, sfdcId: true },
    }),
    db.contact.findMany({
      where: { sfdcId: { not: null } },
      select: { id: true, sfdcId: true },
    }),
  ]);
  const clientBySfdc = new Map(clients.map((c) => [c.sfdcId!, c.id]));
  const contactBySfdc = new Map(contacts.map((c) => [c.sfdcId!, c.id]));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let orphaned = 0;
  /// Contacts belonging to no company at all - 4,486 of the 7,485. Salesforce
  /// records that as its null id rather than a blank, so the column looks
  /// fully populated while most of it means nothing. They are people from
  /// bought lists and old campaigns: worth keeping, worth not pretending are
  /// customers.
  let unattached = 0;

  const toCreate: Prisma.ContactCreateManyInput[] = [];
  const toUpdate: { id: string; data: Record<string, unknown> }[] = [];

  for (const raw of rows) {
    const c = mapContact(raw);
    if (!c) {
      skipped++;
      continue;
    }

    const clientId = c.accountKey ? (clientBySfdc.get(c.accountKey) ?? null) : null;
    if (c.accountKey && !clientId) orphaned++;
    if (!c.accountKey) unattached++;

    const data = {
      clientId,
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      title: c.title,
      phone: c.phone,
      mobile: c.mobile,
      linkedinUrl: c.linkedinUrl,
      city: c.city,
      state: c.state,
      country: c.country,
      noLongerHere: c.noLongerHere,
      optedOutOfEmail: c.optedOutOfEmail,
      notes: c.notes,
      leadSource: c.leadSource,
      ownerId: c.ownerKey ? (users.get(c.ownerKey) ?? null) : null,
      firstSeenAt: c.firstSeenAt,
    };

    const known = contactBySfdc.get(c.sfdcId);
    if (known) toUpdate.push({ id: known, data });
    else toCreate.push({ sfdcId: c.sfdcId, ...data });
  }

  // One statement for the new ones. 7,485 individual inserts is a minute of
  // round trips; this is a second.
  for (const group of chunk(toCreate, 1000)) {
    const result = await db.contact.createMany({ data: group, skipDuplicates: true });
    created += result.count;
  }

  await inBatches(toUpdate, 20, async (u) => {
    await db.contact.update({ where: { id: u.id }, data: u.data });
  });
  updated = toUpdate.length;

  const notes: string[] = [];
  if (orphaned) {
    notes.push(
      `${orphaned} contacts point at an account that isn't here — import Accounts first, then run this again.`,
    );
  }
  if (unattached) {
    notes.push(
      `${unattached.toLocaleString()} contacts belong to no company — Salesforce stored that as a null id, so the column looked full. They're imported and findable, just not filed under a client.`,
    );
  }

  return { step: "contacts", rows: rows.length, created, updated, skipped, notes };
}

// -------------------------------------------------------------------- 4. deals

export async function importDeals(
  csv: string,
  recordTypeCsv?: string,
): Promise<StepReport> {
  const { rows } = parseSheet(csv);
  const types = recordTypes(recordTypeCsv ? parseSheet(recordTypeCsv).rows : []);
  const users = await sfdcUserMap();

  const [clients, contacts, deals] = await Promise.all([
    db.client.findMany({
      where: { sfdcId: { not: null } },
      select: { id: true, sfdcId: true },
    }),
    db.contact.findMany({
      where: { sfdcId: { not: null } },
      select: { id: true, sfdcId: true },
    }),
    db.deal.findMany({
      where: { sfdcId: { not: null } },
      select: { id: true, sfdcId: true },
    }),
  ]);
  const clientBySfdc = new Map(clients.map((c) => [c.sfdcId!, c.id]));
  const contactBySfdc = new Map(contacts.map((c) => [c.sfdcId!, c.id]));
  const dealBySfdc = new Map(deals.map((d) => [d.sfdcId!, d.id]));

  const partners = await ensurePartners(rows.map((r) => r.Type));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let noClient = 0;

  const toCreate: Prisma.DealCreateManyInput[] = [];
  const toUpdate: { id: string; data: Record<string, unknown> }[] = [];

  for (const raw of rows) {
    const d = mapDeal(raw, types);
    if (!d) {
      skipped++;
      continue;
    }

    const clientId = d.accountKey ? clientBySfdc.get(d.accountKey) : undefined;
    if (!clientId) {
      // A deal without a client has nowhere to live: the relationship is
      // required, and inventing a placeholder company would be worse than
      // saying so.
      noClient++;
      skipped++;
      continue;
    }

    const data = {
      clientId,
      name: d.name,
      stage: d.stage,
      type: d.type,
      amount: d.amount,
      closeDate: d.closeDate,
      expectedRevenue: d.expectedRevenue,
      probability: d.probability,
      forecastCategory: d.forecastCategory,
      fiscalYear: d.fiscalYear,
      fiscalQuarter: d.fiscalQuarter,
      quantity: d.quantity,
      legacyId: d.legacyId,
      createdById: d.createdByKey ? (users.get(d.createdByKey) ?? null) : null,
      lastStageChangeAt: d.lastStageChangeAt,
      lastActivityAt: d.lastActivityAt,
      lastModifiedAt: d.lastModifiedAt,
      isWon: d.isWon,
      isClosed: d.isClosed,
      partnerId: d.platform ? (partners.get(d.platform) ?? null) : null,
      businessType: d.businessType,
      leadSource: d.leadSource,
      paymentTerms: d.paymentTerms,
      nextStep: d.nextStep,
      description: d.description,
      lostReason: d.lostReason,
      lostReasonDetail: d.lostReasonDetail,
      customScopeDetail: d.customScopeDetail,
      futurePhaseNotes: d.futurePhaseNotes,
      billingNotes: d.billingNotes,
      projectStartDate: d.projectStartDate,
      projectCompletionDate: d.projectCompletionDate,
      subcontract: d.subcontract,
      partnerHold: d.partnerHold,
      performancePulse: d.performancePulse,
      invoiceSentAt: d.invoiceSentAt,
      invoicePaidAt: d.invoicePaidAt,
      csatScore: d.csatScore,
      ownerId: d.ownerKey ? (users.get(d.ownerKey) ?? null) : null,
      leadConsultantId: d.leadConsultantKey
        ? (users.get(d.leadConsultantKey) ?? null)
        : null,
      secondaryConsultantId: d.secondaryConsultantKey
        ? (users.get(d.secondaryConsultantKey) ?? null)
        : null,
      primaryContactId: d.primaryContactKey
        ? (contactBySfdc.get(d.primaryContactKey) ?? null)
        : null,
      billingContactId: d.billingContactKey
        ? (contactBySfdc.get(d.billingContactKey) ?? null)
        : null,
      partnerAeId: d.partnerAeKey
        ? (contactBySfdc.get(d.partnerAeKey) ?? null)
        : null,
      firstSeenAt: d.firstSeenAt,
    };

    const known = dealBySfdc.get(d.sfdcId);
    if (known) toUpdate.push({ id: known, data });
    else toCreate.push({ sfdcId: d.sfdcId, ...data });
  }

  for (const group of chunk(toCreate, 1000)) {
    const result = await db.deal.createMany({ data: group, skipDuplicates: true });
    created += result.count;
  }
  await inBatches(toUpdate, 20, async (u) => {
    await db.deal.update({ where: { id: u.id }, data: u.data });
  });
  updated = toUpdate.length;

  const notes: string[] = [];
  if (noClient) {
    // Named precisely, because "deals aren't being created" has two very
    // different causes and this is the one the import can see. If the
    // accounts are loaded and this still fires, the Salesforce ids don't
    // line up - which is a different problem from the step failing.
    notes.push(
      `${noClient} of ${rows.length} deals point at an account that isn't in OneSpace. ${
        clients.length === 0
          ? "No accounts have been imported at all — run the Accounts step first."
          : `${clients.length} accounts are loaded, so these particular ones are missing or their Salesforce ids don't match.`
      }`,
    );
  }
  if (created === 0 && toCreate.length > 0) {
    notes.push(
      `${toCreate.length} deals were ready to create and none were written. That is a database refusal rather than a mapping problem — tell me and I'll read it.`,
    );
  }

  return { step: "deals", rows: rows.length, created, updated, skipped, notes };
}

// ------------------------------------------------------------- 5. deal products

export async function importLines(csv: string): Promise<StepReport> {
  const { rows } = parseSheet(csv);

  const [deals, products, lines] = await Promise.all([
    db.deal.findMany({
      where: { sfdcId: { not: null } },
      select: { id: true, sfdcId: true },
    }),
    db.product.findMany({
      where: { sfdcId: { not: null } },
      select: { id: true, sfdcId: true, name: true },
    }),
    db.dealProduct.findMany({
      where: { sfdcId: { not: null } },
      select: { id: true, sfdcId: true },
    }),
  ]);
  const dealBySfdc = new Map(deals.map((d) => [d.sfdcId!, d.id]));
  const productBySfdc = new Map(products.map((p) => [p.sfdcId!, p.id]));
  const productByName = new Map(products.map((p) => [p.name.toLowerCase(), p.id]));
  const lineBySfdc = new Map(lines.map((l) => [l.sfdcId!, l.id]));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  const toCreate: Prisma.DealProductCreateManyInput[] = [];
  const toUpdate: { id: string; data: Prisma.DealProductUpdateInput }[] = [];

  for (const raw of rows) {
    const l = mapLine(raw);
    if (!l) {
      skipped++;
      continue;
    }
    const dealId = l.dealKey ? dealBySfdc.get(l.dealKey) : undefined;
    if (!dealId) {
      skipped++;
      continue;
    }

    // The line points at a pricebook entry rather than the product, so the
    // name is often the only way through. Both are tried.
    const productId =
      (l.productKey ? productBySfdc.get(l.productKey) : undefined) ??
      (l.productName ? productByName.get(l.productName.toLowerCase()) : undefined) ??
      null;

    const data = {
      dealId,
      productId,
      productName: l.productName,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      totalPrice: l.totalPrice,
    };

    const known = lineBySfdc.get(l.sfdcId);
    if (known) toUpdate.push({ id: known, data });
    else toCreate.push({ sfdcId: l.sfdcId, ...data });
  }

  for (const group of chunk(toCreate, 1000)) {
    const result = await db.dealProduct.createMany({ data: group, skipDuplicates: true });
    created += result.count;
  }
  await inBatches(toUpdate, 20, async (u) => {
    await db.dealProduct.update({ where: { id: u.id }, data: u.data });
  });
  updated = toUpdate.length;

  return { step: "lines", rows: rows.length, created, updated, skipped, notes: [] };
}

/** Which file each step wants, by the name Salesforce gives it. */
export const STEP_FILES: Record<Step, string> = {
  people: "User",
  accounts: "Account",
  products: "Product2",
  contacts: "Contact",
  deals: "Opportunity",
  lines: "OpportunityLineItem",
  roles: "OpportunityContactRole",
};

export const STEP_ORDER: Step[] = [
  "people",
  "accounts",
  "products",
  "contacts",
  "deals",
  "lines",
  "roles",
];

// ------------------------------------------------------------ 6. contact roles

/**
 * Who played what part on each deal.
 *
 * Its own object because the role belongs to the pairing: the same person is
 * the billing contact on one deal and the admin on another.
 */
export async function importContactRoles(csv: string): Promise<StepReport> {
  const { rows } = parseSheet(csv);
  const { mapContactRole } = await import("@/lib/crm/sfdc");

  const [deals, contacts, existing] = await Promise.all([
    db.deal.findMany({
      where: { sfdcId: { not: null } },
      select: { id: true, sfdcId: true },
    }),
    db.contact.findMany({
      where: { sfdcId: { not: null } },
      select: { id: true, sfdcId: true },
    }),
    db.dealContactRole.findMany({
      where: { sfdcId: { not: null } },
      select: { id: true, sfdcId: true },
    }),
  ]);
  const dealBySfdc = new Map(deals.map((d) => [d.sfdcId!, d.id]));
  const contactBySfdc = new Map(contacts.map((c) => [c.sfdcId!, c.id]));
  const roleBySfdc = new Map(existing.map((r) => [r.sfdcId!, r.id]));

  const toCreate: Prisma.DealContactRoleCreateManyInput[] = [];
  const toUpdate: { id: string; data: Prisma.DealContactRoleUpdateInput }[] = [];
  let skipped = 0;
  let noDeal = 0;

  for (const raw of rows) {
    const r = mapContactRole(raw);
    if (!r) {
      skipped++;
      continue;
    }
    const dealId = r.dealKey ? dealBySfdc.get(r.dealKey) : undefined;
    if (!dealId) {
      noDeal++;
      skipped++;
      continue;
    }

    const data = {
      dealId,
      contactId: r.contactKey ? (contactBySfdc.get(r.contactKey) ?? null) : null,
      role: r.role,
      isPrimary: r.isPrimary,
    };

    const known = roleBySfdc.get(r.sfdcId);
    if (known) toUpdate.push({ id: known, data });
    else toCreate.push({ sfdcId: r.sfdcId, ...data });
  }

  let created = 0;
  for (const group of chunk(toCreate, 1000)) {
    const result = await db.dealContactRole.createMany({
      data: group,
      skipDuplicates: true,
    });
    created += result.count;
  }
  await inBatches(toUpdate, 20, async (u) => {
    await db.dealContactRole.update({ where: { id: u.id }, data: u.data });
  });

  return {
    step: "roles",
    rows: rows.length,
    created,
    updated: toUpdate.length,
    skipped,
    notes: noDeal
      ? [`${noDeal} roles name a deal that isn't here — import Deals first, then run this again.`]
      : [],
  };
}

/** Unused here, but it keeps the id helper honest across the module. */
export const _idKey = idKey;
