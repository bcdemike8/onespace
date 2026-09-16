/**
 * Salesforce's export, read as OneSpace records.
 *
 * Pure on purpose: rows in, plain objects out, no database and no network.
 * That is what makes it testable against the real column names rather than
 * against an idea of them - and the column names are the whole difficulty
 * here. A mapping written from the field-mapping document would have missed
 * Amount, Close Date and the account name itself, none of which appear in it.
 *
 * Everything below was checked against the actual export: 1,037 accounts,
 * 7,485 contacts, 1,269 deals.
 */

/**
 * Salesforce ids come in two lengths for the same record - 15 characters,
 * case-sensitive, and 18 with a checksum suffix. The same export uses both:
 * RecordType.csv gives 18, the RecordTypeId on an account gives 15. Keying
 * on the first 15 makes them the same thing again.
 */
export const idKey = (id: string | null | undefined): string =>
  (id ?? "").trim().slice(0, 15);

/** A Salesforce placeholder id, which means "nothing" rather than a record. */
const NULL_ID = "000000000000000";

export const refKey = (id: string | null | undefined): string | null => {
  const key = idKey(id);
  return !key || key === NULL_ID ? null : key;
};

export const text = (value: string | undefined): string | null => {
  const v = (value ?? "").trim();
  return v === "" ? null : v;
};

export const bool = (value: string | undefined): boolean =>
  (value ?? "").trim() === "1" || (value ?? "").trim().toLowerCase() === "true";

export function int(value: string | undefined): number | null {
  const v = (value ?? "").trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function decimal(value: string | undefined): number | null {
  const v = (value ?? "").trim().replace(/[$,]/g, "");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Salesforce writes "2026-09-15 17:30:53" and "2026-09-15", both without a
 * zone. Read as UTC: guessing a local zone would shift close dates across a
 * quarter boundary, which is the one place a day's error shows up in a
 * revenue report.
 */
export function date(value: string | undefined): Date | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(v);
  if (!m) return null;
  const [, y, mo, d, h = "0", mi = "0", se = "0"] = m;
  const parsed = new Date(
    Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(se)),
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** A multi-select picklist. Salesforce joins the values with semicolons. */
export function multi(value: string | undefined): string[] {
  return (value ?? "")
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
}

// --------------------------------------------------------------- record types

export type AccountType =
  | "PROSPECT"
  | "CURRENT_CUSTOMER"
  | "PREVIOUS_CUSTOMER"
  | "PARTNER"
  | "COMPETITOR";

const ACCOUNT_TYPE_BY_NAME: Record<string, AccountType> = {
  prospect: "PROSPECT",
  "current customer": "CURRENT_CUSTOMER",
  "previous customer": "PREVIOUS_CUSTOMER",
  partner: "PARTNER",
  competitor: "COMPETITOR",
};

/**
 * The record type ids in RevOptics' own org.
 *
 * A fallback, not the primary path: when RecordType.csv is in the upload the
 * map is built from it by name, which survives a sandbox refresh or a second
 * org. These are here so an import still lands correctly when somebody
 * uploads only the four main files.
 */
const KNOWN_RECORD_TYPES: Record<string, string> = {
  "012ao0000035R97": "Prospect",
  "012ao0000035R4H": "Current Customer",
  "012ao0000035R5t": "Previous Customer",
  "012ao0000035R7V": "Partner",
  "012ao0000035RAj": "Competitor",
  "012ao0000035QZe": "Direct",
  "012ao0000035S5B": "Partner",
};

export type RecordTypes = Map<string, string>;

/** Build the id → name map from RecordType.csv, falling back to the known ids. */
export function recordTypes(rows: Record<string, string>[] = []): RecordTypes {
  const map = new Map<string, string>(Object.entries(KNOWN_RECORD_TYPES));
  for (const row of rows) {
    const key = idKey(row.Id);
    const name = text(row.Name);
    if (key && name) map.set(key, name);
  }
  return map;
}

export function accountType(
  recordTypeId: string | undefined,
  types: RecordTypes,
): AccountType {
  const name = types.get(idKey(recordTypeId));
  return (name && ACCOUNT_TYPE_BY_NAME[name.toLowerCase()]) || "PROSPECT";
}

export function dealRecordType(
  recordTypeId: string | undefined,
  types: RecordTypes,
): "DIRECT" | "PARTNER" {
  return types.get(idKey(recordTypeId))?.toLowerCase() === "partner"
    ? "PARTNER"
    : "DIRECT";
}

// --------------------------------------------------------------------- stages

export type DealStage =
  | "QUALIFICATION"
  | "DISCOVERY"
  | "ASSIGNED"
  | "INTRODUCTION"
  | "PROPOSAL"
  | "CONTRACT"
  | "CLOSED_WON"
  | "CLOSED_LOST";

const STAGES: Record<string, DealStage> = {
  qualification: "QUALIFICATION",
  discovery: "DISCOVERY",
  assigned: "ASSIGNED",
  introduction: "INTRODUCTION",
  proposal: "PROPOSAL",
  contract: "CONTRACT",
  "closed won": "CLOSED_WON",
  "closed lost": "CLOSED_LOST",
};

export function stage(name: string | undefined, isWon = false): DealStage {
  const found = STAGES[(name ?? "").trim().toLowerCase()];
  if (found) return found;
  // An unrecognised stage on a closed deal is still closed. Better to record
  // won or lost than to file a finished deal under Qualification.
  return isWon ? "CLOSED_WON" : "QUALIFICATION";
}

// ----------------------------------------------------------- platform vs type

/**
 * Salesforce's Type field held two different questions.
 *
 * Outreach, Salesloft, Apollo and ZoomInfo say which platform the work is
 * on. New Business and Existing Business say what kind of deal it is. They
 * were the same picklist, which meant no deal could answer both - the 215
 * rows marked "New Business" lost their platform to record it.
 */
const PLATFORMS: Record<string, string> = {
  outreach: "Outreach",
  salesloft: "Salesloft",
  apollo: "Apollo",
  gong: "Gong",
  zoominfo: "ZoomInfo",
  "zoominfo (sl)": "ZoomInfo",
};

export function splitType(value: string | undefined): {
  platform: string | null;
  businessType: string | null;
} {
  const v = (value ?? "").trim();
  if (!v) return { platform: null, businessType: null };

  const platform = PLATFORMS[v.toLowerCase()];
  if (platform) return { platform, businessType: null };

  if (/^(new|existing) business$/i.test(v)) {
    return { platform: null, businessType: v };
  }
  // Something nobody predicted. Kept as the business type rather than
  // dropped, so it shows up in the data instead of vanishing quietly.
  return { platform: null, businessType: v };
}

// -------------------------------------------------------------------- mapping

export interface MappedAccount {
  sfdcId: string;
  name: string;
  accountType: AccountType;
  legalName: string | null;
  website: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  description: string | null;
  industry: string | null;
  employees: number | null;
  annualRevenue: number | null;
  street: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  teamSize: number | null;
  xdrSize: number | null;
  salesRoles: string[];
  technologyUsed: string[];
  ownerKey: string | null;
  platform: string | null;
  firstSeenAt: Date | null;
}

export function mapAccount(
  row: Record<string, string>,
  types: RecordTypes,
): MappedAccount | null {
  const sfdcId = idKey(row.Id);
  const name = text(row.Name);
  if (!sfdcId || !name) return null;

  return {
    sfdcId,
    name,
    accountType: accountType(row.RecordTypeId, types),
    legalName: text(row.Legal_Name__c),
    website: text(row.Website),
    phone: text(row.Phone),
    linkedinUrl: text(row.LinkedIn_URL__c),
    description: text(row.Description),
    industry: text(row.Industry),
    employees: int(row.NumberOfEmployees),
    annualRevenue: decimal(row.AnnualRevenue),
    // Shipping, not Billing. Shipping is filled on 46% of accounts against
    // Billing's 24%, whatever the mapping document says.
    street: text(row.ShippingStreet) ?? text(row.BillingStreet),
    city: text(row.ShippingCity) ?? text(row.BillingCity),
    state: text(row.ShippingState) ?? text(row.BillingState),
    postalCode: text(row.ShippingPostalCode) ?? text(row.BillingPostalCode),
    country: text(row.ShippingCountry) ?? text(row.BillingCountry),
    teamSize: int(row.Team_Size__c),
    xdrSize: int(row.XDR_Size__c),
    salesRoles: multi(row.Sales_Roles_Present__c),
    technologyUsed: multi(row.Technology_Used__c),
    ownerKey: refKey(row.OwnerId),
    platform: splitType(row.Type).platform,
    firstSeenAt: date(row.CreatedDate),
  };
}

export interface MappedContact {
  sfdcId: string;
  accountKey: string | null;
  firstName: string | null;
  lastName: string;
  email: string | null;
  title: string | null;
  phone: string | null;
  mobile: string | null;
  linkedinUrl: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  noLongerHere: boolean;
  optedOutOfEmail: boolean;
  notes: string | null;
  leadSource: string | null;
  ownerKey: string | null;
  firstSeenAt: Date | null;
}

export function mapContact(row: Record<string, string>): MappedContact | null {
  const sfdcId = idKey(row.Id);
  // A contact with no surname is not a person anyone can use. Salesforce
  // requires one, so a row without it is corrupt rather than incomplete.
  const lastName = text(row.LastName);
  if (!sfdcId || !lastName) return null;

  return {
    sfdcId,
    accountKey: refKey(row.AccountId),
    firstName: text(row.FirstName),
    lastName,
    email: text(row.Email)?.toLowerCase() ?? null,
    title: text(row.Title),
    phone: text(row.Phone),
    mobile: text(row.MobilePhone),
    linkedinUrl: text(row.LinkedIn_URL__c),
    city: text(row.MailingCity),
    state: text(row.MailingState),
    country: text(row.MailingCountry),
    noLongerHere: bool(row.No_Longer_With_Company__c),
    optedOutOfEmail: bool(row.HasOptedOutOfEmail),
    notes: text(row.Person_Notes__c),
    leadSource: text(row.LeadSource),
    ownerKey: refKey(row.OwnerId),
    firstSeenAt: date(row.CreatedDate),
  };
}

export interface MappedDeal {
  sfdcId: string;
  accountKey: string | null;
  name: string;
  stage: DealStage;
  type: "DIRECT" | "PARTNER";
  amount: number | null;
  closeDate: Date | null;
  expectedRevenue: number | null;
  probability: number | null;
  forecastCategory: string | null;
  fiscalYear: number | null;
  fiscalQuarter: number | null;
  quantity: number | null;
  legacyId: string | null;
  createdByKey: string | null;
  lastStageChangeAt: Date | null;
  lastActivityAt: Date | null;
  lastModifiedAt: Date | null;
  isWon: boolean;
  isClosed: boolean;
  platform: string | null;
  businessType: string | null;
  leadSource: string | null;
  paymentTerms: string | null;
  nextStep: string | null;
  description: string | null;
  lostReason: string | null;
  lostReasonDetail: string | null;
  customScopeDetail: string | null;
  futurePhaseNotes: string | null;
  billingNotes: string | null;
  projectStartDate: Date | null;
  projectCompletionDate: Date | null;
  subcontract: boolean;
  partnerHold: boolean;
  performancePulse: boolean;
  invoiceSentAt: Date | null;
  invoicePaidAt: Date | null;
  csatScore: number | null;
  ownerKey: string | null;
  leadConsultantKey: string | null;
  secondaryConsultantKey: string | null;
  primaryContactKey: string | null;
  billingContactKey: string | null;
  /// The partner AE, a Contact on the partner's own account.
  partnerAeKey: string | null;
  firstSeenAt: Date | null;
}

export function mapDeal(
  row: Record<string, string>,
  types: RecordTypes,
): MappedDeal | null {
  const sfdcId = idKey(row.Id);
  const name = text(row.Name);
  if (!sfdcId || !name) return null;

  const isWon = bool(row.IsWon);
  const split = splitType(row.Type);

  return {
    sfdcId,
    accountKey: refKey(row.AccountId),
    name,
    stage: stage(row.StageName, isWon),
    type: dealRecordType(row.RecordTypeId, types),
    amount: decimal(row.Amount),
    closeDate: date(row.CloseDate),
    expectedRevenue: decimal(row.ExpectedRevenue),
    probability: int(row.Probability),
    // The readable name, not the code: "Best Case" rather than "BestCase".
    forecastCategory: text(row.ForecastCategoryName) ?? text(row.ForecastCategory),
    fiscalYear: int(row.FiscalYear),
    fiscalQuarter: int(row.FiscalQuarter),
    quantity: decimal(row.TotalOpportunityQuantity),
    legacyId: text(row.Legacy_Record_ID__c),
    createdByKey: refKey(row.CreatedById),
    lastStageChangeAt: date(row.LastStageChangeDate),
    lastActivityAt: date(row.LastActivityDate),
    lastModifiedAt: date(row.LastModifiedDate),
    isWon,
    isClosed: bool(row.IsClosed),
    platform: split.platform,
    businessType: split.businessType,
    leadSource: text(row.LeadSource),
    paymentTerms: text(row.Payment_Terms__c),
    nextStep: text(row.NextStep),
    description: text(row.Description),
    lostReason: text(row.Lost_Reason__c),
    lostReasonDetail: text(row.Lost_Reason_Detail__c),
    customScopeDetail: text(row.Custom_Scope_Detail__c),
    futurePhaseNotes: text(row.Future_Phase_Notes__c),
    billingNotes: text(row.Billing_Notes__c),
    projectStartDate: date(row.Project_Start_Date__c),
    projectCompletionDate: date(row.Project_Completion_Date__c),
    subcontract: bool(row.Subcontract__c),
    partnerHold: bool(row.Partner_Hold__c),
    performancePulse: bool(row.Performance_Pulse_Opt_In__c),
    invoiceSentAt: date(row.Invoice_Sent__c),
    invoicePaidAt: date(row.Invoice_Paid__c),
    csatScore: int(row.CSAT_Score__c),
    ownerKey: refKey(row.OwnerId),
    leadConsultantKey: refKey(row.Lead_Consultant__c),
    secondaryConsultantKey: refKey(row.Secondary_Consultant__c),
    primaryContactKey: refKey(row.Primary_Contact__c) ?? refKey(row.ContactId),
    billingContactKey: refKey(row.Billing_Contact__c),
    partnerAeKey: refKey(row.Partner_AE__c),
    firstSeenAt: date(row.CreatedDate),
  };
}

export interface MappedProduct {
  sfdcId: string;
  name: string;
  description: string | null;
  family: string | null;
  delivery: string | null;
  sowUrl: string | null;
  active: boolean;
}

export function mapProduct(row: Record<string, string>): MappedProduct | null {
  const sfdcId = idKey(row.Id);
  const name = text(row.Name);
  if (!sfdcId || !name) return null;

  return {
    sfdcId,
    name,
    description: text(row.Description),
    family: text(row.Family),
    delivery: text(row.Type__c),
    sowUrl: text(row.SOW_URL__c),
    active: bool(row.IsActive),
  };
}

export interface MappedLine {
  sfdcId: string;
  dealKey: string | null;
  productKey: string | null;
  productName: string | null;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
}

export function mapLine(row: Record<string, string>): MappedLine | null {
  const sfdcId = idKey(row.Id);
  if (!sfdcId) return null;

  return {
    sfdcId,
    dealKey: refKey(row.OpportunityId),
    // The line points at a PricebookEntry, not the product itself. The
    // Product2Id is on the line as well in a full export; where it isn't,
    // the name carries the meaning.
    productKey: refKey(row.Product2Id),
    productName: text(row.Name) ?? text(row.ProductName),
    quantity: decimal(row.Quantity),
    unitPrice: decimal(row.UnitPrice),
    totalPrice: decimal(row.TotalPrice),
  };
}

/**
 * Salesforce users, by id, so an owner becomes a person rather than an id.
 *
 * Matched to OneSpace by email, which is the only thing the two systems
 * genuinely agree on. Eight real people are in this export alongside a dozen
 * integration users; the integration users match nobody and are meant not to.
 */
export function userEmails(rows: Record<string, string>[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const row of rows) {
    const key = idKey(row.Id);
    const email = text(row.Email)?.toLowerCase();
    if (key && email) out.set(key, email);
  }
  return out;
}

export interface MappedContactRole {
  sfdcId: string;
  dealKey: string | null;
  contactKey: string | null;
  role: string | null;
  isPrimary: boolean;
}

/** Who played what part on a deal - billing, audit, admin, sales leader. */
export function mapContactRole(
  row: Record<string, string>,
): MappedContactRole | null {
  const sfdcId = idKey(row.Id);
  if (!sfdcId) return null;

  return {
    sfdcId,
    dealKey: refKey(row.OpportunityId),
    contactKey: refKey(row.ContactId),
    role: text(row.Role),
    isPrimary: bool(row.IsPrimary),
  };
}
