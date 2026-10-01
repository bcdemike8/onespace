import test from "node:test";
import assert from "node:assert/strict";
import { buildWeeklyNudge } from "../src/lib/slack/digest";

const flat = (msg: ReturnType<typeof buildWeeklyNudge>) =>
  JSON.stringify(msg.blocks);

const ONE = buildWeeklyNudge({
  name: "Marcus Callaway",
  url: "https://onespace.revoptics.co",
  projects: [{ id: "p1", name: "Honeycomb | Amplify Core", gapLabel: "Updated 19 days ago" }],
});

const THREE = buildWeeklyNudge({
  name: "Shannon Myers",
  url: "https://onespace.revoptics.co",
  projects: [
    { id: "p1", name: "AdvanStaff HR", gapLabel: "Never updated" },
    { id: "p2", name: "Impartner", gapLabel: "Updated 8 days ago" },
    { id: "p3", name: "Access One", gapLabel: "Updated 12 days ago" },
  ],
});

test("the notification line says how many and who it's for", () => {
  assert.equal(ONE.text, "1 project needs a weekly update — Marcus Callaway");
  assert.equal(THREE.text, "3 projects need a weekly update — Shannon Myers");
});

test("one project reads as one, not as \"1 projects\"", () => {
  assert.match(flat(ONE), /One project you own has had nothing written/);
  assert.match(flat(THREE), /3 projects you own have had nothing written/);
});

test("every project is named, linked, and carries how stale it is", () => {
  const body = flat(THREE);
  for (const p of ["AdvanStaff HR", "Impartner", "Access One"]) {
    assert.ok(body.includes(p), `${p} should be listed`);
  }
  assert.ok(body.includes("https://onespace.revoptics.co/projects/p2"));
  assert.ok(body.includes("Never updated"));
  assert.ok(body.includes("Updated 12 days ago"));
});

test("it points at the one screen that can clear the whole list", () => {
  assert.match(flat(ONE), /\/projects\|Projects>/);
});
