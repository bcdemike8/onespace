import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { RESET, RESET_FIELDS, carriedFields, cloneName } from "../src/lib/crm/clone";

/** The Deal model's real columns, read from the schema rather than retyped. */
function dealColumns(): { all: string[]; unique: string[] } {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const body = /^model Deal \{(.*?)^\}/ms.exec(schema)![1];
  const all: string[] = [];
  const unique: string[] = [];
  for (const line of body.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("/") || t.startsWith("@@") || t.startsWith("*")) continue;
    const m = /^(\w+)\s+(\S+)/.exec(t);
    if (!m) continue;
    const [, name, type] = m;
    // Skip the object side of a relation; only columns can be cloned.
    if (type[0] === type[0].toUpperCase() && !type.startsWith("String") && !type.startsWith("Int") &&
        !type.startsWith("Float") && !type.startsWith("Boolean") && !type.startsWith("DateTime") &&
        !type.startsWith("Decimal") && !type.startsWith("Json")) {
      if (!/Stage|RecordType|Health/.test(type)) continue;
    }
    all.push(name);
    if (t.includes("@unique")) unique.push(name);
  }
  return { all, unique };
}

test("every unique column is reset, or the second clone fails", () => {
  // This is the test that catches a future @unique field: carry-by-default
  // would happily copy it and the insert would blow up on the constraint.
  const { unique } = dealColumns();
  assert.ok(unique.length > 0, "expected the Deal model to have unique columns");
  for (const u of unique) {
    assert.ok(RESET.includes(u), `${u} is @unique and must be in RESET`);
  }
});

test("nothing in the reset list has been renamed out of the schema", () => {
  const { all } = dealColumns();
  for (const f of RESET) {
    assert.ok(all.includes(f), `RESET names ${f}, which is no longer a Deal column`);
  }
});

test("the outcome of the old deal never comes across", () => {
  const carried = carriedFields(dealColumns().all);
  for (const f of ["stage", "isWon", "isClosed", "closeDate", "lostReason"]) {
    assert.ok(!carried.includes(f), `${f} must not be carried`);
  }
});

test("the scope, the money and the people do come across", () => {
  const carried = carriedFields(dealColumns().all);
  for (const f of [
    "name",
    "clientId",
    "type",
    "amount",
    "hoursSold",
    "partnerId",
    "ownerId",
    "leadConsultantId",
    "billingContactId",
    "partnerAeId",
    "paymentTerms",
    "customScopeDetail",
    "subcontract",
  ]) {
    assert.ok(carried.includes(f), `${f} should be carried`);
  }
});

test("a new column is carried by default rather than silently dropped", () => {
  const carried = carriedFields([...dealColumns().all, "somethingAddedNextYear"]);
  assert.ok(carried.includes("somethingAddedNextYear"));
});

test("the reset groups don't overlap, so a field has one stated reason", () => {
  const seen = new Set<string>();
  for (const group of Object.values(RESET_FIELDS)) {
    for (const f of group) {
      assert.ok(!seen.has(f), `${f} is listed in two groups`);
      seen.add(f);
    }
  }
});

test("a clone is marked, and cloning a clone doesn't stack the marker", () => {
  assert.equal(cloneName("Hex - 3 Months Managed Service"), "Hex - 3 Months Managed Service (copy)");
  assert.equal(cloneName("Hex (copy)"), "Hex (copy)");
  assert.equal(cloneName("Hex (copy 4)"), "Hex (copy)");
});

test("a name already taken on the account counts up", () => {
  assert.equal(cloneName("Hex", ["Hex (copy)"]), "Hex (copy 2)");
  assert.equal(cloneName("Hex", ["Hex (copy)", "Hex (copy 2)"]), "Hex (copy 3)");
  // Cloning the clone lands on the next free number, not on itself.
  assert.equal(cloneName("Hex (copy)", ["Hex (copy)"]), "Hex (copy 2)");
});

test("a deal named only '(copy)' still gets a usable name", () => {
  assert.equal(cloneName("(copy)"), "(copy) (copy)");
});
