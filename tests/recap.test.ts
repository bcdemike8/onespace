import { test } from "node:test";
import assert from "node:assert/strict";
import { looksLikeRecap, ownWords } from "@/lib/mail/recap";

/**
 * Which sent mail is a recap, and what of it Claude gets to read. Made-up
 * email, shaped like a real one: hard-wrapped lines, a numbered list with no
 * "Next steps" heading, then a sign-off and a quoted reply.
 */
const email = [
  "Hi Jordan,",
  "",
  "Thanks again for your time today! Here is a recap of the remaining items we",
  "need to address.",
  "",
  "   1. *Region Mapping:* Create a custom \"Region\" field on the Account",
  "   object and map it to the matching field in Outreach.",
  "   2. *Sandbox:* Confirm whether the sandbox has API access, so we'll need",
  "   to check the profile settings.",
  "",
  "Thanks again!",
  "",
  "Best,",
  "",
  "Priya",
  "",
  "On Mon, 16 Nov 2026 at 13:17, Jordan Lee <jordan@northwind.example> wrote:",
  "> Thanks for the call",
].join("\n");

test("a sent email with recap in the subject is a recap", () => {
  assert.ok(looksLikeRecap("Northwind + RevOptics 11/16 Recap", email));
});

test("a next-steps heading makes it a recap whatever the subject", () => {
  assert.ok(looksLikeRecap("Following on", "Hi,\n\nNext steps:\n- I'll send the doc"));
});

test("ordinary sent mail is not a recap", () => {
  assert.ok(!looksLikeRecap("Lunch on Thursday?", "Are you free at noon?"));
});

test("Claude reads the whole list, wrapped lines and all, but not the sign-off or quote", () => {
  const words = ownWords(email).join("\n");
  assert.ok(words.includes("object and map it to the matching field in Outreach."));
  assert.ok(words.includes("to check the profile settings."));
  assert.ok(!words.includes("Priya"));
  assert.ok(!words.includes("Thanks for the call"));
});
