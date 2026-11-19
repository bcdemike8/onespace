import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_NAME,
  cleanTaskName,
  matchExisting,
  sameName,
  tidyName,
} from "../src/lib/timesheet-task";

const named = (name: string) => ({ id: name, name });

test("a name is trimmed and its whitespace collapsed", () => {
  assert.equal(tidyName("  Client   escalation \n call "), "Client escalation call");
});

test("nothing typed is not a task", () => {
  for (const raw of ["", "   ", "\n\t"]) {
    assert.deepEqual(cleanTaskName(raw), { error: "Say what the work was." });
  }
});

test("a name comes back tidy", () => {
  assert.deepEqual(cleanTaskName("  Emergency   rebuild "), {
    name: "Emergency rebuild",
  });
});

test("a paragraph is refused rather than silently cut in half", () => {
  const long = "a".repeat(MAX_NAME + 1);
  const r = cleanTaskName(long);
  assert.ok("error" in r);
  assert.match(r.error, /under 120 characters/);
  // The boundary itself is fine.
  assert.deepEqual(cleanTaskName("a".repeat(MAX_NAME)), { name: "a".repeat(MAX_NAME) });
});

test("length is measured after tidying, so stray spaces don't fail it", () => {
  assert.deepEqual(cleanTaskName(`  ${"a".repeat(MAX_NAME)}  `), {
    name: "a".repeat(MAX_NAME),
  });
});

test("case and spacing don't make it a different task", () => {
  assert.equal(sameName("Client Call", "client  call"), true);
  assert.equal(sameName(" Training ", "training"), true);
  assert.equal(sameName("Training", "Training notes"), false);
});

test("an existing task is reused rather than duplicated", () => {
  const tasks = [named("Build Out"), named("General Admin")];
  assert.equal(matchExisting("build out", tasks)?.id, "Build Out");
  assert.equal(matchExisting("  GENERAL   admin ", tasks)?.id, "General Admin");
  assert.equal(matchExisting("Escalation call", tasks), null);
});

test("matching an empty list finds nothing rather than throwing", () => {
  assert.equal(matchExisting("anything", []), null);
});
