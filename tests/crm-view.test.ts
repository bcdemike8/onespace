import { test } from "node:test";
import assert from "node:assert/strict";
import {
  accountWhere,
  asAccountFilter,
  asDealFilter,
  crmHref,
  dealWhere,
  money,
  searchWhere,
} from "@/lib/crm/view";

test("the default view is the companies RevOptics works with", () => {
  assert.equal(asAccountFilter(undefined), "working");
  assert.equal(asAccountFilter("nonsense"), "working");
  assert.deepEqual(accountWhere("working"), {
    accountType: { in: ["CURRENT_CUSTOMER", "PREVIOUS_CUSTOMER", "PARTNER"] },
  });
});

test("618 cold prospects are not what the page opens on", () => {
  const where = accountWhere("working") as { accountType: { in: string[] } };
  assert.ok(!where.accountType.in.includes("PROSPECT"));
});

test("Everyone really means everyone", () => {
  assert.deepEqual(accountWhere("all"), {});
});

test("deals default to the twenty that are still live", () => {
  assert.equal(asDealFilter(undefined), "open");
  assert.deepEqual(dealWhere("open"), { isClosed: false });
});

test("lost is closed-and-not-won, not merely not-won", () => {
  // An open deal is also not won. Without isClosed it would show up as lost.
  assert.deepEqual(dealWhere("lost"), { isClosed: true, isWon: false });
});

test("a one-character search matches nothing rather than everything", () => {
  assert.deepEqual(searchWhere("a", ["name"]), {});
  assert.deepEqual(searchWhere("", ["name"]), {});
  assert.deepEqual(searchWhere("  ", ["name"]), {});
});

test("a real search looks across every field it was given", () => {
  assert.deepEqual(searchWhere("muck", ["name", "website"]), {
    OR: [
      { name: { contains: "muck", mode: "insensitive" } },
      { website: { contains: "muck", mode: "insensitive" } },
    ],
  });
});

test("money reads at a glance and says so when there is none", () => {
  assert.equal(money(18500), "$18,500");
  assert.equal(money(5353925), "$5,353,925");
  assert.equal(money(null), "—");
  assert.equal(money(undefined), "—");
});

test("changing one filter keeps the others", () => {
  const href = crmHref("/crm", { type: "prospects", q: "muck" }, { type: null });
  assert.equal(href, "/crm?q=muck");
});

test("a link with nothing on it is just the path", () => {
  assert.equal(crmHref("/crm", {}, {}), "/crm");
});
