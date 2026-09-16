import { test } from "node:test";
import assert from "node:assert/strict";
import { addressLines, employeeRange, revenueRange } from "@/lib/crm/account";

/**
 * Salesforce computed these on the way to the screen, so they aren't in the
 * export and have to be reproduced. Every band is a boundary, and a boundary
 * is where this kind of thing goes wrong: 50 staff is 11-50, not 51-100.
 */

test("employee bands are inclusive at the top", () => {
  assert.equal(employeeRange(10), "1-10");
  assert.equal(employeeRange(11), "11-50");
  assert.equal(employeeRange(50), "11-50");
  assert.equal(employeeRange(51), "51-100");
  assert.equal(employeeRange(1_000), "501-1,000");
  assert.equal(employeeRange(1_001), "1,001-5,000");
});

test("the top band has no ceiling", () => {
  assert.equal(employeeRange(50_000), "25,001-50,000");
  assert.equal(employeeRange(50_001), "50,001+");
  assert.equal(employeeRange(4_000_000), "50,001+");
});

test("no headcount is not a band", () => {
  assert.equal(employeeRange(null), null);
  assert.equal(employeeRange(undefined), null);
  assert.equal(employeeRange(0), null);
});

test("revenue bands follow the same rule", () => {
  assert.equal(revenueRange(999_999), "Less than $1M");
  assert.equal(revenueRange(1_000_000), "Less than $1M");
  assert.equal(revenueRange(1_000_001), "$1M - $10M");
  assert.equal(revenueRange(50_000_000), "$10M - $50M");
  assert.equal(revenueRange(1_000_000_000), "$500M - $1B");
  assert.equal(revenueRange(1_000_000_001), "$1B+");
});

test("no revenue is not a band", () => {
  assert.equal(revenueRange(null), null);
  assert.equal(revenueRange(0), null);
});

test("an address drops the parts it doesn't have", () => {
  assert.deepEqual(
    addressLines({
      street: "2700 Commerce St",
      city: "Dallas",
      state: "TX",
      postalCode: "75226",
      country: "United States",
    }),
    ["2700 Commerce St", "Dallas, TX, 75226", "United States"],
  );
});

test("a city on its own is still an address", () => {
  assert.deepEqual(addressLines({ city: "Austin" }), ["Austin"]);
});

test("nothing at all is no lines, not a line of commas", () => {
  assert.deepEqual(addressLines({}), []);
  assert.deepEqual(addressLines({ street: null, city: null }), []);
});
