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
