import { test } from "node:test";
import assert from "node:assert/strict";
import { buildNameIndex } from "@/lib/commitments/owner";
import {
  looksLikeFragment,
  promisedDate,
  quoteInSource,
  recapSender,
  vetActionItems,
  type Candidate,
} from "@/lib/commitments/pipeline";

/**
 * The checks between Claude's reading and My work, run on realistic sources
 * and on the answers Claude might give - right ones, and wrong ones.
 *
 * What this proves: whatever Claude says, a customer's task, an invented
 * quote, a fragment or an owner who wasn't there never reaches a personal
 * list, and a real commitment reaches the right person. What it can't prove
 * is that Claude judges real conversations well - that is what
 * `npm run eval:commitments` measures, against the real model.
 *
 * Every name and company here is made up.
 */

const people = [
  { id: "priya", name: "Priya Shah" },
  { id: "sam", name: "Sam Ortiz" },
  { id: "dana", name: "Dana Whitfield-Ross" },
];
const team = buildNameIndex(people);

const item = (over: Partial<Candidate>): Candidate => ({
  title: "Send Northwind the field mapping doc",
  task: "Send Northwind the field mapping document covering the Lead and Contact fields.",
  owner: "Priya Shah",
  ours: true,
  when: null,
  quote: "I'll send you the field mapping doc",
  ...over,
});

// ------------------------------------------------- the recap that went wrong

// Shaped like the real 16 November recap, with the client and people renamed.
const recap = `Hi Jordan,

Thanks again for your time today! Here is a recap of the remaining items we
need to address.

   1. *Outreach Stage Mapping:* Create a custom "Outreach Stage" field on
   the Lead object in Salesforce and map it to the corresponding Stage field
   in Outreach (Field Name: Stage).
   2. *Task Sync Testing:* Continue troubleshooting the task sync between
   Outreach and Salesforce. Tasks were not appearing on the associated Lead or
   Contact records in Salesforce, so we'll need to confirm whether a
   Salesforce setting or configuration is preventing them from being displayed
   correctly.
   3. *Historical Sync:* Determine whether a historical sync is needed to
   bring existing Salesforce records into Outreach, and if so, agree on the
   timeframe and approach.

Thanks again, and looking forward to getting these final items wrapped up!`;

const fromPriya = { text: recap, presentIds: new Set(["priya"]) };

test("the 16 Nov recap: Claude's correct answer (all the client's) puts nothing on My work", () => {
  const out = vetActionItems(
    [
      item({ title: "Create and map the Outreach Stage field", owner: "Jordan", ours: false, quote: 'Create a custom "Outreach Stage" field on the Lead object in Salesforce' }),
      item({ title: "Continue troubleshooting the task sync", owner: null, ours: false, quote: "Continue troubleshooting the task sync between Outreach and Salesforce" }),
      item({ title: "Determine whether a historical sync is needed", owner: null, ours: false, quote: "Determine whether a historical sync is needed" }),
    ],
    team,
    people,
    fromPriya,
  );
  assert.equal(out.owned.length, 0);
  assert.equal(out.unidentified.length, 0);
});

test("the 16 Nov recap: even if Claude wrongly claimed them for the sender, no named owner means nothing", () => {
  const out = vetActionItems(
    [item({ title: "Continue troubleshooting the task sync", owner: null, quote: "Continue troubleshooting the task sync between Outreach and Salesforce" })],
    team,
    people,
    fromPriya,
  );
  assert.equal(out.owned.length, 0);
});

test("the 16 Nov recap: the old fragment is rejected even if it were offered as ours", () => {
  const out = vetActionItems(
    [
      item({
        title: "Contact records in Salesforce",
        task: "Contact records in Salesforce, so we'll need to confirm whether a",
        quote: "Contact records in Salesforce, so we'll need to confirm whether a",
      }),
    ],
    team,
    people,
    fromPriya,
  );
  assert.equal(out.owned.length, 0);
  assert.equal(out.rejected[0].reason, "not a whole task");
});

test("the same recap with an explicit 'I'll investigate...' line gives the sender exactly that", () => {
  const withMine = `${recap}

I'll investigate why completed Outreach tasks aren't associating with Salesforce Contact records and share my findings with Jordan.`;
  const out = vetActionItems(
    [
      item({
        title: "Investigate Outreach tasks missing from Salesforce Contacts",
        task: "Investigate why completed Outreach tasks aren't associating with Salesforce Contact records, and share the findings with Jordan at Northwind.",
        quote: "I'll investigate why completed Outreach tasks aren't associating with Salesforce Contact records and share my findings with Jordan.",
      }),
    ],
    team,
    people,
    { text: withMine, presentIds: new Set(["priya"]) },
  );
  assert.equal(out.owned.length, 1);
  assert.equal(out.owned[0].ownerId, "priya");
});

// ------------------------------------------------------------- on a call

// A transcript as Claude receives it: each turn starts with the speaker.
const call = `
Priya Shah: Thanks for joining. Sam's on with us today too.
Jordan Lee: Great. Can you send us the updated sequence templates?
Priya Shah: Sure, I'll get the updated sequences over to you by Friday.
Jordan Lee: And we'll configure the Region field ourselves on our side.
Sam Ortiz: The sync errors I can take care of. I'll work with Outreach Support to resolve it.
Jordan Lee: Could someone look at the dashboard filters at some point?
Priya Shah: Let's see how the rollout goes first.
Sam Ortiz: Once Jordan sends the export, I'll run the historical import.
Priya Shah: We already completed the configuration of the BDR profile earlier.
`;

// Priya hosted; Sam joined; Jordan is the customer.
const onCall = { text: call, presentIds: new Set(["priya"]) };

test("a consultant accepting a customer request owns it, with the promised date", () => {
  const out = vetActionItems(
    [item({ title: "Send Northwind the updated sequences", quote: "Sure, I'll get the updated sequences over to you by Friday.", when: "by Friday" })],
    team,
    people,
    onCall,
  );
  assert.equal(out.owned[0].ownerId, "priya");
  const said = new Date("2026-11-18T00:00:00Z"); // a Wednesday
  assert.equal(promisedDate(out.owned[0].when, said)?.toISOString().slice(0, 10), "2026-11-20");
});

test("a commitment made on a colleague's call goes to the person who made it", () => {
  const out = vetActionItems(
    [
      item({
        title: "Resolve the sync errors with Outreach Support",
        task: "Work with Outreach Support to resolve Northwind's sync errors.",
        owner: "Sam Ortiz",
        quote: "The sync errors I can take care of. I'll work with Outreach Support to resolve it.",
      }),
    ],
    team,
    people,
    // Sam isn't the host - he's known to be there because he spoke.
    { text: call, presentIds: new Set(["priya", "sam"]) },
  );
  assert.equal(out.owned.length, 1);
  assert.equal(out.owned[0].ownerId, "sam");
});

test("two consultants on one call each get their own commitment", () => {
  const out = vetActionItems(
    [
      item({ title: "Send Northwind the updated sequences", quote: "I'll get the updated sequences over to you by Friday" }),
      item({ title: "Run the historical import after the export", task: "Run the historical import once Jordan at Northwind sends the export.", owner: "Sam Ortiz", quote: "Once Jordan sends the export, I'll run the historical import." }),
    ],
    team,
    people,
    { text: call, presentIds: new Set(["priya", "sam"]) },
  );
  assert.deepEqual(out.owned.map((o) => o.ownerId), ["priya", "sam"]);
});

test("a commitment that waits on the customer is kept, with what it waits on", () => {
  const out = vetActionItems(
    [item({ title: "Run the historical import after the export", task: "Run the historical import once Jordan at Northwind sends the export.", owner: "Sam Ortiz", quote: "Once Jordan sends the export, I'll run the historical import." })],
    team,
    people,
    { text: call, presentIds: new Set(["priya", "sam"]) },
  );
  assert.match(out.owned[0].task, /once Jordan .* sends the export/);
});

test("the customer's own task is never a RevOptics commitment", () => {
  const out = vetActionItems(
    [item({ title: "Configure the Region field", owner: "Jordan Lee", ours: false, quote: "we'll configure the Region field ourselves on our side" })],
    team,
    people,
    onCall,
  );
  assert.equal(out.owned.length + out.unidentified.length, 0);
});

test("a customer Claude mistakes for one of ours is on nobody's My work", () => {
  const out = vetActionItems(
    [item({ title: "Configure the Region field on the Lead", owner: "Jordan Lee", ours: true, quote: "we'll configure the Region field ourselves on our side" })],
    team,
    people,
    onCall,
  );
  assert.equal(out.owned.length, 0);
  assert.equal(out.unidentified.length, 1);
});

test("a customer who shares a consultant's first name isn't matched to them", () => {
  const out = vetActionItems(
    [item({ title: "Send the export for the import", owner: "Sam Brown", quote: "Once Jordan sends the export, I'll run the historical import." })],
    team,
    people,
    onCall,
  );
  assert.equal(out.owned.length, 0);
});

test("an owner who wasn't on the call and isn't mentioned in it is on nobody's My work", () => {
  const out = vetActionItems(
    [item({ title: "Send Northwind the updated sequences", owner: "Dana Whitfield-Ross", quote: "I'll get the updated sequences over to you by Friday" })],
    team,
    people,
    onCall,
  );
  assert.equal(out.owned.length, 0);
  assert.equal(out.unidentified.length, 1);
});

test("an item with no single owner - talk of next steps - is dropped", () => {
  const out = vetActionItems(
    [item({ title: "Look at the dashboard filters", owner: null, quote: "Could someone look at the dashboard filters at some point?" })],
    team,
    people,
    onCall,
  );
  assert.equal(out.owned.length, 0);
  assert.equal(out.rejected[0].reason, "no single RevOptics owner named");
});

test("a quote that isn't in the source is never evidence", () => {
  const out = vetActionItems(
    [item({ title: "Rebuild the BDR dashboard", quote: "I'll rebuild the BDR dashboard next week" })],
    team,
    people,
    onCall,
  );
  assert.equal(out.owned.length, 0);
  assert.equal(out.rejected[0].reason, "its quote isn't in the source");
});

// ---------------------------------------------------------- the pieces

test("a quote is found across line breaks, curly quotes and a dropped word", () => {
  assert.ok(quoteInSource("Tasks were not appearing on the associated Lead or Contact records in Salesforce", recap));
  assert.ok(quoteInSource("Sure, I’ll get the updated sequences over to you by Friday.", call));
  assert.ok(quoteInSource("I'll get the updated sequences over to you Friday", call));
  assert.ok(!quoteInSource("I'll", call));
});

test("fragments are recognised by how they end", () => {
  assert.ok(looksLikeFragment("Contact records in Salesforce, so we'll need to confirm whether a"));
  assert.ok(looksLikeFragment("Send the mapping to"));
  assert.ok(!looksLikeFragment("Send Northwind the field mapping doc"));
});

test("no deadline given means no date - never a calculated one", () => {
  const said = new Date("2026-11-18T00:00:00Z");
  assert.equal(promisedDate(null, said), null);
  assert.equal(promisedDate("", said), null);
  assert.equal(promisedDate("when we can", said), null);
  assert.ok(promisedDate("by Friday", said));
});

test("a recap is read only from its sender's own mailbox, as theirs", () => {
  const byEmail = new Map([
    ["priya@revoptics.example", { id: "priya", name: "Priya Shah" }],
    ["sam@revoptics.example", { id: "sam", name: "Sam Ortiz" }],
  ]);
  // Priya's recap, in Priya's mailbox: hers.
  assert.equal(recapSender("Priya@RevOptics.example", "priya", byEmail)?.id, "priya");
  // The same recap, in Sam's mailbox because he was copied: not read there.
  assert.equal(recapSender("priya@revoptics.example", "sam", byEmail), null);
  // Somebody who isn't a OneSpace person: nobody's.
  assert.equal(recapSender("intern@revoptics.example", "priya", byEmail), null);
});
