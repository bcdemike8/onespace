import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accountType,
  bool,
  date,
  decimal,
  idKey,
  mapAccount,
  mapContact,
  mapDeal,
  mapProduct,
  multi,
  pick,
  recordTypes,
  refKey,
  splitType,
  stage,
  userEmails,
} from "@/lib/crm/sfdc";

/**
 * Written against the real export, not against the field-mapping document.
 * Where the two disagree the export wins, because it is what exists.
 */

const TYPES = recordTypes([
  { Id: "012ao0000035R97AAE", Name: "Prospect", SobjectType: "Account" },
  { Id: "012ao0000035R4HAAU", Name: "Current Customer", SobjectType: "Account" },
  { Id: "012ao0000035S5BAAU", Name: "Partner", SobjectType: "Opportunity" },
  { Id: "012ao0000035QZeAAM", Name: "Direct", SobjectType: "Opportunity" },
]);

// ------------------------------------------------------------------ primitives

test("a 15-character id and its 18-character form are the same record", () => {
  assert.equal(idKey("012ao0000035R97"), idKey("012ao0000035R97AAE"));
});

test("Salesforce's null id means nothing, not a record", () => {
  assert.equal(refKey("000000000000000AAA"), null);
  assert.equal(refKey(""), null);
  assert.equal(refKey("001ao00001VSlzKAAT"), "001ao00001VSlzK");
});

test("dates are read as UTC, so a close date can't slip a quarter", () => {
  assert.equal(date("2026-09-15")?.toISOString(), "2026-09-15T00:00:00.000Z");
  assert.equal(
    date("2026-09-15 17:30:53")?.toISOString(),
    "2026-09-15T17:30:53.000Z",
  );
  assert.equal(date(""), null);
  assert.equal(date("not a date"), null);
});

test("booleans are Salesforce's 0 and 1", () => {
  assert.equal(bool("1"), true);
  assert.equal(bool("0"), false);
  assert.equal(bool(""), false);
});

test("money survives currency formatting", () => {
  assert.equal(decimal("15000.0"), 15000);
  assert.equal(decimal("$12,500.50"), 12500.5);
  assert.equal(decimal(""), null);
});

test("multi-select picklists are semicolon-joined", () => {
  assert.deepEqual(multi("XDR;Sales;CS;AM"), ["XDR", "Sales", "CS", "AM"]);
  assert.deepEqual(multi(""), []);
});

// ---------------------------------------------------------------- record types

test("account record types map to the names people use", () => {
  assert.equal(accountType("012ao0000035R97", TYPES), "PROSPECT");
  assert.equal(accountType("012ao0000035R4H", TYPES), "CURRENT_CUSTOMER");
});

test("an unknown record type lands a company in Prospect, not nowhere", () => {
  assert.equal(accountType("012xxxxxxxxxxxx", TYPES), "PROSPECT");
});

test("the known ids work even when RecordType.csv wasn't uploaded", () => {
  const bare = recordTypes();
  assert.equal(accountType("012ao0000035R7V", bare), "PARTNER");
  assert.equal(accountType("012ao0000035R5t", bare), "PREVIOUS_CUSTOMER");
});

// ---------------------------------------------------------------------- stages

test("every stage that appears in the export maps", () => {
  assert.equal(stage("Closed Won"), "CLOSED_WON");
  assert.equal(stage("Closed Lost"), "CLOSED_LOST");
  assert.equal(stage("Proposal"), "PROPOSAL");
  assert.equal(stage("Assigned"), "ASSIGNED");
  assert.equal(stage("Introduction"), "INTRODUCTION");
  assert.equal(stage("Contract"), "CONTRACT");
  assert.equal(stage("Discovery"), "DISCOVERY");
});

test("an unrecognised stage on a won deal is still won", () => {
  assert.equal(stage("Signed!", true), "CLOSED_WON");
  assert.equal(stage("Signed!", false), "QUALIFICATION");
});

// ----------------------------------------------------------- the Type field

test("platform and business type are pulled apart", () => {
  assert.deepEqual(splitType("Outreach"), {
    platform: "Outreach",
    businessType: null,
  });
  assert.deepEqual(splitType("New Business"), {
    platform: null,
    businessType: "New Business",
  });
});

test("ZoomInfo (SL) is ZoomInfo", () => {
  assert.equal(splitType("ZoomInfo (SL)").platform, "ZoomInfo");
});

test("a value nobody predicted is kept rather than dropped", () => {
  assert.equal(splitType("Renewal").businessType, "Renewal");
});

// --------------------------------------------------------------------- records

test("an account maps, taking its address from Shipping", () => {
  const a = mapAccount(
    {
      Id: "001ao00001VSlzKAAT",
      Name: "Muck Rack",
      RecordTypeId: "012ao0000035R4H",
      Legal_Name__c: "Muck Rack, Inc.",
      Website: "muckrack.com",
      Industry: "Software & Technology",
      NumberOfEmployees: "240",
      AnnualRevenue: "30000000.0",
      ShippingCity: "New York",
      ShippingState: "NY",
      BillingCity: "Nowhere",
      Sales_Roles_Present__c: "XDR;Sales",
      Type: "Outreach",
      OwnerId: "005ao000005StjRAAS",
      CreatedDate: "2024-10-21 13:43:14",
    },
    TYPES,
  )!;

  assert.equal(a.name, "Muck Rack");
  assert.equal(a.accountType, "CURRENT_CUSTOMER");
  assert.equal(a.city, "New York", "Shipping must win over Billing");
  assert.equal(a.employees, 240);
  assert.equal(a.annualRevenue, 30000000);
  assert.deepEqual(a.salesRoles, ["XDR", "Sales"]);
  assert.equal(a.platform, "Outreach");
  assert.equal(a.ownerKey, "005ao000005StjR");
});

test("Billing is used when Shipping is empty, rather than losing the address", () => {
  const a = mapAccount(
    { Id: "001x", Name: "Acme", BillingCity: "Austin", BillingState: "TX" },
    TYPES,
  )!;
  assert.equal(a.city, "Austin");
  assert.equal(a.state, "TX");
});

test("an account with no name is refused rather than imported blank", () => {
  assert.equal(mapAccount({ Id: "001x", Name: "" }, TYPES), null);
  assert.equal(mapAccount({ Id: "", Name: "Acme" }, TYPES), null);
});

test("a contact maps, and lower-cases the email for matching", () => {
  const c = mapContact({
    Id: "003ao00001abcDEFGHI",
    AccountId: "001ao00001VSlzKAAT",
    FirstName: "Sam",
    LastName: "Okafor",
    Email: "Sam.Okafor@MuckRack.com",
    Title: "VP Sales",
    No_Longer_With_Company__c: "1",
    HasOptedOutOfEmail: "1",
  })!;

  assert.equal(c.email, "sam.okafor@muckrack.com");
  assert.equal(c.accountKey, "001ao00001VSlzK");
  assert.equal(c.noLongerHere, true);
  assert.equal(c.optedOutOfEmail, true);
});

test("a contact with no surname is refused", () => {
  assert.equal(mapContact({ Id: "003x", LastName: "" }), null);
});

test("a deal keeps the three fields the mapping document forgot", () => {
  const d = mapDeal(
    {
      Id: "006ao00001abcDEFGHI",
      AccountId: "001ao00001VSlzKAAT",
      Name: "RevOptics & Muck Rack | Amplify Starter",
      StageName: "Closed Won",
      RecordTypeId: "012ao0000035S5B",
      Amount: "18500.0",
      CloseDate: "2026-03-31",
      IsWon: "1",
      IsClosed: "1",
      Type: "Outreach",
      Payment_Terms__c: "Net 30",
      Lead_Consultant__c: "005ao000005StY9AAK",
      Subcontract__c: "0",
    },
    TYPES,
  )!;

  assert.equal(d.name, "RevOptics & Muck Rack | Amplify Starter");
  assert.equal(d.amount, 18500, "Amount is 99% filled and absent from the doc");
  assert.equal(d.closeDate?.toISOString(), "2026-03-31T00:00:00.000Z");
  assert.equal(d.accountKey, "001ao00001VSlzK");
  assert.equal(d.stage, "CLOSED_WON");
  assert.equal(d.type, "PARTNER");
  assert.equal(d.platform, "Outreach");
  assert.equal(d.leadConsultantKey, "005ao000005StY9");
});

test("a deal falls back to ContactId when Primary_Contact__c is empty", () => {
  const d = mapDeal(
    { Id: "006x", Name: "X", ContactId: "003ao00001abcDEFGHI" },
    TYPES,
  )!;
  assert.equal(d.primaryContactKey, "003ao00001abcDE");
});

test("a product carries the link to its statement of work", () => {
  const p = mapProduct({
    Id: "01tao000005253yAAA",
    Name: "Engage Implementation (1-19)",
    Type__c: "Asana & Salesforce",
    SOW_URL__c: "https://docs.google.com/document/d/abc/edit",
    IsActive: "1",
  })!;

  assert.equal(p.delivery, "Asana & Salesforce");
  assert.match(p.sowUrl!, /docs\.google\.com/);
  assert.equal(p.active, true);
});

test("users map id to email, which is what OneSpace matches on", () => {
  const map = userEmails([
    { Id: "005ao000005StjRAAS", Email: "Brianna@RevOptics.co" },
    { Id: "005ao000004fMGnAAM", Email: "" },
  ]);
  assert.equal(map.get("005ao000005StjR"), "brianna@revoptics.co");
  assert.equal(map.size, 1, "a user with no email maps to nobody");
});

// --------------------------------------------- the rest of the Opportunity page

test("a column is found under whichever of its names the export used", () => {
  // Exact first.
  assert.equal(pick({ SQL_Date__c: "a", sqldate: "b" }, "SQL_Date__c"), "a");
  // Then flattened: case, spaces, underscores and the __c suffix don't count.
  assert.equal(pick({ "SQL Date": "2026-07-14" }, "SQL_Date__c"), "2026-07-14");
  assert.equal(pick({ sql_date: "x" }, "SQL_Date__c"), "x");
  // Candidates are tried in order.
  assert.equal(
    pick({ Sales_Qualified_Date__c: "x" }, "SQL_Date__c", "Sales_Qualified_Date__c"),
    "x",
  );
  // But a longer name is a different field, not a spelling of this one.
  assert.equal(pick({ SQL_Date_Owner__c: "x" }, "SQL_Date__c"), undefined);
  assert.equal(pick({ Id: "1" }, "SQL_Date__c"), undefined);
});

const DEAL = { Id: "006ao00000000001", Name: "State Affairs - DS" };

test("the SQL checkbox and the date it was ticked both come across", () => {
  const d = mapDeal(
    { ...DEAL, SQL__c: "1", SQL_Date__c: "2026-07-14 11:29:00" },
    TYPES,
  )!;
  assert.equal(d.isSql, true);
  assert.equal(d.sqlDate?.toISOString(), "2026-07-14T11:29:00.000Z");
});

test("a field whose label starts with a digit is read through its X", () => {
  const d = mapDeal(
    {
      ...DEAL,
      Audit_Completed__c: "1",
      Audit_Completed_Date__c: "2026-08-01",
      X3_Month_Audit_Date__c: "2026-10-14",
    },
    TYPES,
  )!;
  assert.equal(d.auditCompleted, true);
  assert.equal(d.auditCompletedDate?.toISOString().slice(0, 10), "2026-08-01");
  assert.equal(d.threeMonthAuditDate?.toISOString().slice(0, 10), "2026-10-14");
});

test("a deal length of zero is zero, not missing", () => {
  // The screenshot that started this showed "Deal Length 0". A truthiness
  // check anywhere in the chain would have turned it into an em dash.
  assert.equal(mapDeal({ ...DEAL, Deal_Length__c: "0" }, TYPES)!.dealLength, 0);
  assert.equal(mapDeal({ ...DEAL, Project_Duration__c: "0" }, TYPES)!.projectDuration, 0);
});

test("the three lookups with nowhere to point are kept as they stood", () => {
  const d = mapDeal(
    {
      ...DEAL,
      ContractId: "800ao00000000001",
      SyncedQuoteId: "",
      CampaignId: "701ao00000000001",
    },
    TYPES,
  )!;
  assert.equal(d.contractRef, "800ao00000000001");
  assert.equal(d.syncedQuoteRef, null);
  assert.equal(d.campaignSourceRef, "701ao00000000001");
});

test("who last touched the deal is kept alongside when", () => {
  const d = mapDeal(
    { ...DEAL, LastModifiedById: "005ao00000000009", LastModifiedDate: "2026-07-20 17:50:00" },
    TYPES,
  )!;
  assert.equal(d.lastModifiedByKey, "005ao0000000000");
  assert.equal(d.lastModifiedAt?.toISOString(), "2026-07-20T17:50:00.000Z");
});

test("none of the new fields invent a value when the column isn't exported", () => {
  const d = mapDeal(DEAL, TYPES)!;
  assert.equal(d.isSql, false);
  assert.equal(d.sqlDate, null);
  assert.equal(d.dealLength, null);
  assert.equal(d.auditCompleted, false);
  assert.equal(d.auditCompletedDate, null);
  assert.equal(d.threeMonthAuditDate, null);
  assert.equal(d.projectDuration, null);
  assert.equal(d.contractRef, null);
  assert.equal(d.syncedQuoteRef, null);
  assert.equal(d.campaignSourceRef, null);
  assert.equal(d.lastModifiedByKey, null);
});

// ----------------------------------------------------- the rest of the Contact

const CONTACT = { Id: "003ao00000000001", LastName: "Eyring", FirstName: "Brandon" };

test("the contact fields the old mapping had nowhere to put", () => {
  const c = mapContact({
    ...CONTACT,
    Fax: "+14434675896",
    Department: "Revenue Operations",
    ReportsToId: "003ao00000000009",
    MailingStreet: "1 Market St\nSuite 300",
    MailingCity: "Baltimore",
    MailingState: "MD",
    MailingPostalCode: "21201",
    MailingCountry: "USA",
    Description: "Met at Unleash.",
    Referral_Lead_Source__c: "Henry Krass",
    CreatedById: "005ao00000000001",
    LastModifiedById: "005ao00000000002",
    LastModifiedDate: "2026-08-03 09:13:00",
  })!;
  assert.equal(c.fax, "+14434675896");
  assert.equal(c.department, "Revenue Operations");
  assert.equal(c.reportsToKey, "003ao0000000000");
  assert.equal(c.street, "1 Market St\nSuite 300");
  assert.equal(c.postalCode, "21201");
  assert.equal(c.description, "Met at Unleash.");
  assert.equal(c.referralLeadSource, "Henry Krass");
  assert.equal(c.createdByKey, "005ao0000000000");
  assert.equal(c.lastModifiedAt?.toISOString(), "2026-08-03T09:13:00.000Z");
});

test("Person Notes and Description stay apart", () => {
  // Two fields that both read as "notes" and mean different things. Merging
  // them would lose which was which, and one of them is 4,000 characters.
  const c = mapContact({
    ...CONTACT,
    Person_Notes__c: "Andrew Henningsen",
    Description: "Long-form history of the account.",
  })!;
  assert.equal(c.notes, "Andrew Henningsen");
  assert.equal(c.description, "Long-form history of the account.");
});

test("a contact who reports to nobody reports to nobody", () => {
  // Salesforce writes its null id rather than a blank, which would otherwise
  // read as a real manager that no lookup can find.
  const c = mapContact({ ...CONTACT, ReportsToId: "000000000000000AAA" })!;
  assert.equal(c.reportsToKey, null);
});

test("none of the new contact fields invent a value", () => {
  const c = mapContact(CONTACT)!;
  assert.equal(c.fax, null);
  assert.equal(c.department, null);
  assert.equal(c.reportsToKey, null);
  assert.equal(c.street, null);
  assert.equal(c.postalCode, null);
  assert.equal(c.description, null);
  assert.equal(c.referralLeadSource, null);
  assert.equal(c.createdByKey, null);
  assert.equal(c.lastModifiedByKey, null);
  assert.equal(c.lastModifiedAt, null);
});
