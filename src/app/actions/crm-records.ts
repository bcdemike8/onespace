"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import {
  bool,
  choice,
  date,
  decimal,
  int,
  list,
  percent,
  relation,
  required,
  stageFlags,
  defaultProbability,
  text,
} from "@/lib/crm/form";

/**
 * Writing to the CRM.
 *
 * One action per record type, handling create and update through the same
 * path: a form that creates and a form that edits are the same form, and
 * giving them separate actions is how the two drift until one of them forgets
 * a field somebody has been filling in for a month.
 *
 * requireUser rather than requireAdmin. Importing the CRM rewrites thousands
 * of rows and is admin-only for that reason; correcting one phone number is
 * ordinary work, and locking it behind an admin means the correction never
 * gets made.
 *
 * Every action records who touched the record and when, in the same fields
 * the Salesforce import wrote - so a page can't tell you whether "Last
 * modified by" means Salesforce or OneSpace, which is exactly right: it
 * means the last person who changed it.
 */

export type SaveState = { error?: string; ok?: boolean };

const refresh = () => {
  revalidatePath("/crm", "layout");
  revalidatePath("/clients", "layout");
};

/** What a unique-constraint failure was actually about. */
function duplicateField(e: unknown): string | null {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
    const target = e.meta?.target;
    if (Array.isArray(target)) return target.join(", ");
    if (typeof target === "string") return target;
    return "that value";
  }
  return null;
}

const ACCOUNT_TYPES = [
  "PROSPECT",
  "CURRENT_CUSTOMER",
  "PREVIOUS_CUSTOMER",
  "PARTNER",
  "COMPETITOR",
] as const;

const STAGES = [
  "QUALIFICATION",
  "DISCOVERY",
  "ASSIGNED",
  "INTRODUCTION",
  "PROPOSAL",
  "CONTRACT",
  "CLOSED_WON",
  "CLOSED_LOST",
] as const;

// ------------------------------------------------------------------ accounts

export async function saveAccountAction(
  _prev: SaveState,
  form: FormData,
): Promise<SaveState> {
  const user = await requireUser();

  const id = text(form.get("id"));
  const name = required(form.get("name"));
  if (!name) return { error: "An account needs a name." };

  const parentId = relation(form.get("parentId"));
  if (id && parentId === id) {
    // Cheap to do and impossible to undo from the UI if it lands: the
    // account page walks parents, so a self-parent is an infinite page.
    return { error: "An account can't be its own parent." };
  }

  const data = {
    name,
    legalName: text(form.get("legalName")),
    accountType: choice(form.get("accountType"), ACCOUNT_TYPES, "PROSPECT"),
    partnerId: relation(form.get("partnerId")),
    ownerId: relation(form.get("ownerId")),
    parentId,
    industry: text(form.get("industry")),
    website: text(form.get("website")),
    linkedinUrl: text(form.get("linkedinUrl")),
    phone: text(form.get("phone")),
    description: text(form.get("description")),
    notes: text(form.get("notes")),
    employees: int(form.get("employees")),
    annualRevenue: decimal(form.get("annualRevenue")),
    xdrSize: int(form.get("xdrSize")),
    teamSize: int(form.get("teamSize")),
    technologyUsed: list(form.get("technologyUsed")),
    salesRoles: list(form.get("salesRoles")),
    funders: list(form.get("funders")),
    escalation: bool(form.get("escalation")),
    apolloStage: text(form.get("apolloStage")),
    implementationOwner: text(form.get("implementationOwner")),
    billingStreet: text(form.get("billingStreet")),
    billingCity: text(form.get("billingCity")),
    billingState: text(form.get("billingState")),
    billingPostalCode: text(form.get("billingPostalCode")),
    billingCountry: text(form.get("billingCountry")),
    // The unprefixed address columns are the shipping one; billing has its
    // own prefix. Named on the page rather than in the schema, which is a
    // wart worth a comment rather than a migration.
    street: text(form.get("street")),
    city: text(form.get("city")),
    state: text(form.get("state")),
    postalCode: text(form.get("postalCode")),
    country: text(form.get("country")),
    primaryContactId: relation(form.get("primaryContactId")),
    lastModifiedAt: new Date(),
  };

  let landing: string;
  try {
    if (id) {
      await db.client.update({ where: { id }, data });
      landing = `/crm/${id}`;
    } else {
      const created = await db.client.create({
        data: { ...data, createdById: user.id, firstSeenAt: new Date() },
      });
      landing = `/crm/${created.id}`;
    }
  } catch (e) {
    const field = duplicateField(e);
    if (field) {
      return {
        error: `Another account already uses that ${field === "name" ? "name" : field}. Names have to be unique — add the division or the city to tell them apart.`,
      };
    }
    throw e;
  }

  refresh();
  redirect(landing);
}

// ------------------------------------------------------------------ contacts

export async function saveContactAction(
  _prev: SaveState,
  form: FormData,
): Promise<SaveState> {
  const user = await requireUser();

  const id = text(form.get("id"));
  const lastName = required(form.get("lastName"));
  if (!lastName) return { error: "A contact needs at least a surname." };

  const reportsToId = relation(form.get("reportsToId"));
  if (id && reportsToId === id) {
    return { error: "A contact can't report to themselves." };
  }

  const data = {
    firstName: text(form.get("firstName")),
    lastName,
    clientId: relation(form.get("clientId")),
    title: text(form.get("title")),
    email: text(form.get("email"))?.toLowerCase() ?? null,
    phone: text(form.get("phone")),
    mobile: text(form.get("mobile")),
    fax: text(form.get("fax")),
    department: text(form.get("department")),
    reportsToId,
    linkedinUrl: text(form.get("linkedinUrl")),
    street: text(form.get("street")),
    city: text(form.get("city")),
    state: text(form.get("state")),
    postalCode: text(form.get("postalCode")),
    country: text(form.get("country")),
    notes: text(form.get("notes")),
    description: text(form.get("description")),
    leadSource: text(form.get("leadSource")),
    referralLeadSource: text(form.get("referralLeadSource")),
    noLongerHere: bool(form.get("noLongerHere")),
    optedOutOfEmail: bool(form.get("optedOutOfEmail")),
    ownerId: relation(form.get("ownerId")),
    lastModifiedById: user.id,
    lastModifiedAt: new Date(),
  };

  let landing: string;
  if (id) {
    await db.contact.update({ where: { id }, data });
    landing = `/crm/contacts/${id}`;
  } else {
    const created = await db.contact.create({
      data: { ...data, createdById: user.id, firstSeenAt: new Date() },
    });
    landing = `/crm/contacts/${created.id}`;
  }

  refresh();
  redirect(landing);
}

// --------------------------------------------------------------------- deals

export async function saveDealAction(
  _prev: SaveState,
  form: FormData,
): Promise<SaveState> {
  const user = await requireUser();

  const id = text(form.get("id"));
  const name = required(form.get("name"));
  const clientId = relation(form.get("clientId"));
  if (!name) return { error: "A deal needs a name." };
  if (!clientId) {
    // The relation is required in the schema, so this would be a database
    // error rather than a message. Said plainly instead.
    return { error: "Choose the account this deal belongs to." };
  }

  const stage = choice(form.get("stage"), STAGES, "QUALIFICATION");
  const flags = stageFlags(stage);
  const typedProbability = percent(form.get("probability"));

  const data = {
    name,
    clientId,
    stage,
    ...flags,
    type: choice(form.get("type"), ["DIRECT", "PARTNER"] as const, "DIRECT"),
    amount: decimal(form.get("amount")),
    closeDate: date(form.get("closeDate")),
    // Left empty on a closed deal, the stage answers it. Left empty on an
    // open one it stays empty, because that is a judgement nobody has made.
    probability: typedProbability ?? defaultProbability(stage),
    forecastCategory: text(form.get("forecastCategory")),
    partnerId: relation(form.get("partnerId")),
    businessType: text(form.get("businessType")),
    leadSource: text(form.get("leadSource")),
    paymentTerms: text(form.get("paymentTerms")),
    nextStep: text(form.get("nextStep")),
    description: text(form.get("description")),
    lostReason: text(form.get("lostReason")),
    lostReasonDetail: text(form.get("lostReasonDetail")),
    customScopeDetail: text(form.get("customScopeDetail")),
    futurePhaseNotes: text(form.get("futurePhaseNotes")),
    billingNotes: text(form.get("billingNotes")),
    projectStartDate: date(form.get("projectStartDate")),
    projectCompletionDate: date(form.get("projectCompletionDate")),
    projectDuration: int(form.get("projectDuration")),
    subcontract: bool(form.get("subcontract")),
    partnerHold: bool(form.get("partnerHold")),
    performancePulse: bool(form.get("performancePulse")),
    invoiceSentAt: date(form.get("invoiceSentAt")),
    invoicePaidAt: date(form.get("invoicePaidAt")),
    csatScore: int(form.get("csatScore")),
    isSql: bool(form.get("isSql")),
    sqlDate: date(form.get("sqlDate")),
    dealLength: int(form.get("dealLength")),
    auditCompleted: bool(form.get("auditCompleted")),
    auditCompletedDate: date(form.get("auditCompletedDate")),
    threeMonthAuditDate: date(form.get("threeMonthAuditDate")),
    contractRef: text(form.get("contractRef")),
    syncedQuoteRef: text(form.get("syncedQuoteRef")),
    campaignSourceRef: text(form.get("campaignSourceRef")),
    ownerId: relation(form.get("ownerId")),
    leadConsultantId: relation(form.get("leadConsultantId")),
    secondaryConsultantId: relation(form.get("secondaryConsultantId")),
    primaryContactId: relation(form.get("primaryContactId")),
    billingContactId: relation(form.get("billingContactId")),
    partnerAeId: relation(form.get("partnerAeId")),
    lastModifiedById: user.id,
    lastModifiedAt: new Date(),
  };

  let landing: string;
  if (id) {
    const before = await db.deal.findUnique({
      where: { id },
      select: { stage: true },
    });
    await db.deal.update({
      where: { id },
      data: {
        ...data,
        // Only when it actually moved. Touching it on every save would make
        // "stage last changed" mean "last edited", which is a different fact
        // and one the page already shows.
        ...(before && before.stage !== stage ? { lastStageChangeAt: new Date() } : {}),
      },
    });
    landing = `/crm/deals/${id}`;
  } else {
    const created = await db.deal.create({
      data: {
        ...data,
        createdById: user.id,
        firstSeenAt: new Date(),
        lastStageChangeAt: new Date(),
      },
    });
    landing = `/crm/deals/${created.id}`;
  }

  refresh();
  redirect(landing);
}

// ---------------------------------------------------------------- deal lines

export async function saveLineAction(
  _prev: SaveState,
  form: FormData,
): Promise<SaveState> {
  const user = await requireUser();

  const id = text(form.get("id"));
  const dealId = relation(form.get("dealId"));
  if (!dealId) return { error: "A product line has to belong to a deal." };

  const productId = relation(form.get("productId"));
  const typedName = text(form.get("productName"));
  if (!productId && !typedName) {
    return { error: "Choose a product, or type what was sold." };
  }

  const quantity = decimal(form.get("quantity"));
  const unitPrice = decimal(form.get("unitPrice"));
  const typedTotal = decimal(form.get("totalPrice"));

  // Quantity times price, unless somebody typed a total that disagrees - in
  // which case theirs wins. A discount applied at the line rather than the
  // unit is real, and recomputing over it would quietly erase it.
  const totalPrice =
    typedTotal ?? (quantity !== null && unitPrice !== null ? quantity * unitPrice : null);

  const data = {
    dealId,
    productId,
    productName: typedName,
    productCode: text(form.get("productCode")),
    quantity,
    unitPrice,
    totalPrice,
    listPrice: decimal(form.get("listPrice")),
    serviceDate: date(form.get("serviceDate")),
    description: text(form.get("description")),
    lastModifiedById: user.id,
    lastModifiedAt: new Date(),
  };

  let landing: string;
  if (id) {
    await db.dealProduct.update({ where: { id }, data });
    landing = `/crm/lines/${id}`;
  } else {
    const created = await db.dealProduct.create({
      data: { ...data, createdById: user.id, firstSeenAt: new Date() },
    });
    landing = `/crm/lines/${created.id}`;
  }

  refresh();
  redirect(landing);
}

/**
 * Remove a product line from a deal.
 *
 * The only delete here. A line is a row on an order form and removing one is
 * routine; deleting an account, a contact or a deal is not, and nothing on
 * these pages offers it - a deal that shouldn't be counted gets a stage, not
 * a grave.
 */
export async function deleteLineAction(
  _prev: SaveState,
  form: FormData,
): Promise<SaveState> {
  await requireUser();

  const id = text(form.get("id"));
  if (!id) return { error: "Nothing to remove." };

  const line = await db.dealProduct.findUnique({
    where: { id },
    select: { dealId: true },
  });
  if (!line) return { error: "That line has already gone." };

  await db.dealProduct.delete({ where: { id } });
  refresh();
  redirect(`/crm/deals/${line.dealId}`);
}

// --------------------------------------------------------------- stage moves

/**
 * Move a deal to a stage, from the path on its own page.
 *
 * Its own action rather than a trip through the whole deal form, because a
 * stage change is one decision and should cost one decision's worth of
 * effort - but it is not a small write. Won and lost follow from it,
 * probability follows from it when it closes, and the date it last moved is
 * what "stage last changed" means.
 *
 * Probability is only touched when the deal closes. A closed deal is 100 or
 * 0 and there is nothing to argue about; an open one's odds are somebody's
 * judgement, and walking a deal from Discovery to Proposal is no reason to
 * overwrite it.
 */
export async function setDealStageAction(
  _prev: SaveState,
  form: FormData,
): Promise<SaveState> {
  const user = await requireUser();

  const id = text(form.get("id"));
  if (!id) return { error: "Which deal?" };

  const stage = choice(form.get("stage"), STAGES, "QUALIFICATION");
  const lostReason = text(form.get("lostReason"));

  const before = await db.deal.findUnique({
    where: { id },
    select: { stage: true, probability: true },
  });
  if (!before) return { error: "That deal has gone." };

  if (before.stage === stage && !lostReason) {
    // Already there. Not an error, and not worth a write that would move
    // "stage last changed" to today for no reason.
    return { ok: true };
  }

  const flags = stageFlags(stage);
  const closing = flags.isClosed;

  await db.deal.update({
    where: { id },
    data: {
      stage,
      ...flags,
      ...(closing ? { probability: defaultProbability(stage) } : {}),
      // Only when moving to lost, and only when something was typed - so
      // reopening a deal doesn't strip the reason it was lost last time.
      ...(stage === "CLOSED_LOST" && lostReason ? { lostReason } : {}),
      ...(before.stage !== stage ? { lastStageChangeAt: new Date() } : {}),
      lastModifiedById: user.id,
      lastModifiedAt: new Date(),
    },
  });

  refresh();
  revalidatePath(`/crm/deals/${id}`);
  return { ok: true };
}
