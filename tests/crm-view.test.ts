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
  stagePath,
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

// ------------------------------------------------------------- the stage path

test("the stage path marks where a deal has got to", () => {
  const path = stagePath("PROPOSAL");
  assert.equal(path.length, 7);
  assert.deepEqual(
    path.map((s) => s.state),
    ["done", "done", "done", "done", "current", "todo", "todo"],
  );
  assert.equal(path[6].label, "Closed Won");
});

test("a won deal has walked the whole road", () => {
  const path = stagePath("CLOSED_WON");
  assert.equal(path.filter((s) => s.state === "done").length, 6);
  assert.equal(path[6].state, "current");
  assert.equal(path[6].label, "Closed Won");
});

test("a lost deal ends in Lost, and Won never appears beside it", () => {
  const path = stagePath("CLOSED_LOST");
  assert.equal(path[6].label, "Closed Lost");
  assert.equal(path[6].state, "current");
  assert.equal(path.some((s) => s.stage === "CLOSED_WON"), false);
});

test("a lost deal claims no stage it cannot prove it reached", () => {
  // Salesforce overwrites the stage on close, so where it stopped is gone.
  // Ticking Contract would be the page inventing the answer.
  assert.equal(stagePath("CLOSED_LOST").some((s) => s.state === "done"), false);
});

test("a deal at the first stage has nothing behind it", () => {
  const path = stagePath("QUALIFICATION");
  assert.equal(path[0].state, "current");
  assert.equal(path.some((s) => s.state === "done"), false);
});
