import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { parseSheet } from "@/lib/csv";
import { mapAccount, recordTypes, type MappedAccount } from "@/lib/crm/sfdc";
import { planAccounts, type ExistingClient } from "@/lib/crm/plan";

/**
 * Client names are unique, and 16 of the 1,037 accounts share a name with
 * another company. Getting this wrong either merges two businesses into one
 * row or stops the import partway through — so it is fixed here rather than
 * discovered on row 400.
 */

const account = (over: Partial<MappedAccount> = {}): MappedAccount =>
  ({
    sfdcId: "001aaaaaaaaaaaa",
    name: "Acme",
    accountType: "CURRENT_CUSTOMER",
    legalName: null,
    website: null,
    phone: null,
    linkedinUrl: null,
    description: null,
    industry: null,
    employees: null,
    annualRevenue: null,
    street: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    teamSize: null,
    xdrSize: null,
    salesRoles: [],
    technologyUsed: [],
    ownerKey: null,
    platform: null,
    firstSeenAt: null,
    ...over,
  }) as MappedAccount;

const fields = (a: MappedAccount) => ({ accountType: a.accountType });

test("a known Salesforce id updates rather than creating a second row", () => {
  const existing: ExistingClient[] = [
    { id: "c1", name: "Acme", sfdcId: "001aaaaaaaaaaaa" },
  ];
  const plan = planAccounts([account()], existing, fields);
  assert.equal(plan.creates.length, 0);
  assert.deepEqual(plan.updates.map((u) => u.id), ["c1"]);
});

test("a client typed in by hand is adopted, not duplicated", () => {
  const existing: ExistingClient[] = [{ id: "c1", name: "Acme", sfdcId: null }];
  const plan = planAccounts([account()], existing, fields);
  assert.equal(plan.creates.length, 0);
  assert.equal(plan.updates[0].id, "c1");
  assert.equal(plan.updates[0].data.sfdcId, "001aaaaaaaaaaaa");
  assert.match(plan.notes[0], /Matched existing client "Acme"/);
});

test("a hand-typed client is adopted once, not by every account sharing its name", () => {
  const existing: ExistingClient[] = [{ id: "c1", name: "Acme", sfdcId: null }];
  const plan = planAccounts(
    [account({ sfdcId: "001aaaaaaaaaaaa" }), account({ sfdcId: "001bbbbbbbbbbbb" })],
    existing,
    fields,
  );
  assert.equal(plan.updates.length, 1, "only the first may adopt it");
  assert.equal(plan.creates.length, 1);
  assert.equal(plan.creates[0].name, "Acme (2)");
});

test("two different companies of the same name both survive", () => {
  const plan = planAccounts(
    [account({ sfdcId: "001aaaaaaaaaaaa" }), account({ sfdcId: "001bbbbbbbbbbbb" })],
    [],
    fields,
  );
  assert.deepEqual(plan.creates.map((c) => c.name), ["Acme", "Acme (2)"]);
  assert.match(plan.notes[0], /Two accounts are called "Acme"/);
});

test("a third of the same name keeps counting", () => {
  const plan = planAccounts(
    [
      account({ sfdcId: "001aaaaaaaaaaaa" }),
      account({ sfdcId: "001bbbbbbbbbbbb" }),
      account({ sfdcId: "001ccccccccccccc" }),
    ],
    [],
    fields,
  );
  assert.deepEqual(plan.creates.map((c) => c.name), ["Acme", "Acme (2)", "Acme (3)"]);
});

test("a second run of the same file creates nothing new", () => {
  const first = planAccounts(
    [account({ sfdcId: "001aaaaaaaaaaaa" }), account({ sfdcId: "001bbbbbbbbbbbb" })],
    [],
    fields,
  );
  // What the database would hold afterwards.
  const existing: ExistingClient[] = first.creates.map((c, i) => ({
    id: `c${i}`,
    name: c.name,
    sfdcId: c.sfdcId,
  }));
  const second = planAccounts(
    [account({ sfdcId: "001aaaaaaaaaaaa" }), account({ sfdcId: "001bbbbbbbbbbbb" })],
    existing,
    fields,
  );
  assert.equal(second.creates.length, 0, "re-running must not duplicate");
  assert.equal(second.updates.length, 2);
  assert.equal(second.notes.length, 0, "and must not repeat the warnings");
});

test("rows that couldn't be mapped are counted, not silently dropped", () => {
  const plan = planAccounts([null, account(), null], [], fields);
  assert.equal(plan.skipped, 2);
  assert.equal(plan.creates.length, 1);
});

/**
 * The real file, when it is to hand. Skipped in CI, where it isn't - the
 * point is to have checked it against 1,037 real rows at least once, not to
 * depend on a copy of somebody's CRM living in the repository.
 */
const REAL = "/tmp/sfdc/csv/Account.csv";
test("the real export plans cleanly: 1,037 creates, 18 renames", { skip: !existsSync(REAL) }, () => {
  const rows = parseSheet(readFileSync(REAL, "utf8")).rows;
  const types = recordTypes();
  const plan = planAccounts(
    rows.map((r) => mapAccount(r, types)),
    [],
    fields,
  );

  assert.equal(plan.skipped, 0, "every row maps");
  assert.equal(plan.creates.length, 1037);
  assert.equal(plan.updates.length, 0, "nothing to update on an empty database");

  // 16 names are shared by more than one company, but "Skaled" appears four
  // times on its own - so 16 duplicated names produce 18 renamed rows. The
  // two numbers measure different things and it is worth pinning both.
  const renamed = plan.creates.filter((c) => / \(\d+\)$/.test(c.name));
  assert.equal(renamed.length, 18, "18 rows need a distinguished name");

  const base = new Set(renamed.map((c) => c.name.replace(/ \(\d+\)$/, "")));
  assert.equal(base.size, 16, "16 distinct names are shared");
  assert.ok(base.has("Skaled"));

  const names = new Set(plan.creates.map((c) => c.name.toLowerCase()));
  assert.equal(names.size, plan.creates.length, "every final name is unique");
});
