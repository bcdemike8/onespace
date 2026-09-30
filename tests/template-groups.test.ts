import test from "node:test";
import assert from "node:assert/strict";
import {
  OTHER,
  groupTemplates,
  labelUnder,
  splitFamily,
} from "../src/lib/template-groups";

const t = (name: string, groupName: string | null = null) => ({
  id: name,
  name,
  groupName,
});

/** The real picker contents, so the test fails if the real list regresses. */
const REAL = [
  t("Outreach Implementation — Amplify Core (1-19 seats)"),
  t("Outreach Implementation — Amplify Core (20-49 seats)"),
  t("Outreach Implementation — Amplify Core (50-99 seats)"),
  t("Outreach Implementation — Amplify Plus (20-49 seats)"),
  t("Outreach Implementation — Amplify Plus (50-99 seats)"),
  t("Outreach Implementation: Engage (1-19)"),
  t("Outreach Implementation: Engage (20-49)"),
  t("Amplify Starter"),
  t("Outreach Implementation: Engage + Starter Add-On (1-19) (variant 2)"),
  t("Quick Start - 10 Hours"),
  t("Salesloft — Do-It-For-You Onboarding", "Salesloft"),
];

const headings = (rows: ReturnType<typeof groupTemplates>) => rows.map(([g]) => g);
const under = (rows: ReturnType<typeof groupTemplates>, group: string) =>
  rows.find(([g]) => g === group)?.[1].map((o) => o.optionLabel) ?? [];

test("a family is the name before its bracket", () => {
  assert.deepEqual(splitFamily("Amplify Core (1-19 seats)"), [
    "Amplify Core",
    "1-19 seats",
  ]);
  assert.equal(splitFamily("Amplify Starter"), null);
  // Nothing before the bracket is not a family name.
  assert.equal(splitFamily("(20-49)"), null);
});

test("sibling SOWs collapse into one heading", () => {
  const rows = groupTemplates(REAL);
  assert.deepEqual(under(rows, "Outreach Implementation — Amplify Core"), [
    "1-19 seats",
    "20-49 seats",
    "50-99 seats",
  ]);
  assert.deepEqual(under(rows, "Outreach Implementation: Engage"), ["1-19", "20-49"]);
});

test("an explicit heading gets its own section with one template in it", () => {
  const rows = groupTemplates(REAL);
  assert.deepEqual(under(rows, "Salesloft"), ["Do-It-For-You Onboarding"]);
});

test("a lone bracketed name stays in the catch-all, suffix and all", () => {
  const rows = groupTemplates(REAL);
  // "(variant 2)" is a dedupe suffix; heading it "variant 2" would be worse
  // than leaving the whole name where someone can read it.
  assert.ok(
    under(rows, OTHER).includes(
      "Outreach Implementation: Engage + Starter Add-On (1-19) (variant 2)",
    ),
  );
  assert.ok(under(rows, OTHER).includes("Amplify Starter"));
  assert.ok(under(rows, OTHER).includes("Quick Start - 10 Hours"));
});

test("the catch-all sorts last, the rest alphabetically", () => {
  const rows = groupTemplates(REAL);
  assert.equal(headings(rows).at(-1), OTHER);
  const named = headings(rows).slice(0, -1);
  assert.deepEqual(named, [...named].sort((a, b) => a.localeCompare(b)));
});

test("a heading is not repeated inside its own options", () => {
  assert.equal(labelUnder("Salesloft", "Salesloft — Do-It-For-You Onboarding"), "Do-It-For-You Onboarding");
  assert.equal(labelUnder("Salesloft", "Salesloft: Migration"), "Migration");
  assert.equal(labelUnder("Salesloft", "Salesloft Admin Training"), "Admin Training");
  // A name that isn't prefixed by its heading is left alone.
  assert.equal(labelUnder("Salesloft", "Cadence rebuild"), "Cadence rebuild");
  // And a name that is only the heading keeps something to click on.
  assert.equal(labelUnder("Salesloft", "Salesloft"), "Salesloft");
});

test("an explicit heading beats the inferred family", () => {
  const rows = groupTemplates([
    t("Amplify Core (1-19 seats)"),
    t("Amplify Core (20-49 seats)", "Pinned"),
  ]);
  assert.deepEqual(under(rows, "Pinned"), ["Amplify Core (20-49 seats)"]);
  // Its sibling is now alone, so it drops to the catch-all rather than
  // heading a family of one.
  assert.deepEqual(under(rows, OTHER), ["Amplify Core (1-19 seats)"]);
});

test("blank and whitespace group names are not headings", () => {
  const rows = groupTemplates([t("Amplify Starter", "   "), t("Quick Start", "")]);
  assert.deepEqual(headings(rows), [OTHER]);
});

test("an empty list groups into nothing", () => {
  assert.deepEqual(groupTemplates([]), []);
});
