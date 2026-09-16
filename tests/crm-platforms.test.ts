import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PLATFORM_NAMES,
  byPlatformOrder,
  isPlatform,
  platformFor,
} from "@/lib/crm/platforms";

test("the list is exactly the six platforms, in the order given", () => {
  assert.deepEqual([...PLATFORM_NAMES], [
    "Apollo",
    "Outreach.io",
    "RevOptics",
    "Salesloft",
    "Skaled",
    "ZoomInfo",
  ]);
});

test("Salesforce's spelling and the canonical one are the same platform", () => {
  // The export says "Outreach"; the list says "Outreach.io". A filter that
  // offers both is a filter nobody can use.
  assert.equal(platformFor("Outreach"), "Outreach.io");
  assert.equal(platformFor("Outreach.io"), "Outreach.io");
  assert.equal(platformFor("ZoomInfo (SL)"), "ZoomInfo");
  assert.equal(platformFor("apollo.io"), "Apollo");
  assert.equal(platformFor("  salesloft  "), "Salesloft");
});

test("a client that ended up in the partner table is not a platform", () => {
  // These are real rows the Asana import created, and the reason the Type
  // filter was offering nine options instead of six.
  for (const name of [
    "Association for Talent Development",
    "DailyPay",
    "Forerunners Group",
    "Murdoch Marketing",
    "Nerdio",
    "Okres",
  ]) {
    assert.equal(platformFor(name), null, name);
    assert.equal(isPlatform(name), false, name);
  }
});

test("nothing and nonsense are not platforms", () => {
  assert.equal(platformFor(null), null);
  assert.equal(platformFor(""), null);
  assert.equal(platformFor("   "), null);
});

test("platforms sort in the list's order, strays after them", () => {
  const mixed = ["ZoomInfo", "Nerdio", "Apollo", "DailyPay", "Salesloft"];
  assert.deepEqual(mixed.sort(byPlatformOrder), [
    "Apollo",
    "Salesloft",
    "ZoomInfo",
    "DailyPay",
    "Nerdio",
  ]);
});

test("an off-list partner sorts last rather than disappearing", () => {
  // A deal pointing at one still has to be findable, so it is ranked, not
  // dropped.
  assert.ok(byPlatformOrder("Apollo", "Nerdio") < 0);
  assert.ok(byPlatformOrder("Nerdio", "ZoomInfo") > 0);
});
