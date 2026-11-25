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

const fromPriya = { kind: "email" as const, text: recap, presentIds: new Set(["priya"]), senderId: "priya" };

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
    { kind: "email" as const, text: withMine, presentIds: new Set(["priya"]), senderId: "priya" },
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
const onCall = { kind: "call" as const, text: call, presentIds: new Set(["priya"]) };

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
    { kind: "call" as const, text: call, presentIds: new Set(["priya", "sam"]) },
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
    { kind: "call" as const, text: call, presentIds: new Set(["priya", "sam"]) },
  );
  assert.deepEqual(out.owned.map((o) => o.ownerId), ["priya", "sam"]);
});

test("a commitment that waits on the customer is kept, with what it waits on", () => {
  const out = vetActionItems(
    [item({ title: "Run the historical import after the export", task: "Run the historical import once Jordan at Northwind sends the export.", owner: "Sam Ortiz", quote: "Once Jordan sends the export, I'll run the historical import." })],
    team,
    people,
    { kind: "call" as const, text: call, presentIds: new Set(["priya", "sam"]) },
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

test("an item with no individual owner is held for review, on nobody's list", () => {
  const out = vetActionItems(
    [item({ title: "Look at the dashboard filters", owner: null, quote: "Could someone look at the dashboard filters at some point?" })],
    team,
    people,
    onCall,
  );
  assert.equal(out.owned.length, 0);
  assert.equal(out.unidentified[0].reason, "a RevOptics commitment with no individual owner");
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

// ------------------------------------------------ owner must be in the quote

test("a quote running from the customer's request into the acceptance is evidence", () => {
  const out = vetActionItems(
    [
      item({
        title: "Send Northwind the updated sequences",
        quote: "Can you send us the updated sequence templates? Sure, I'll get the updated sequences over to you by Friday.",
        when: "by Friday",
      }),
    ],
    team,
    people,
    onCall,
  );
  assert.equal(out.owned.length, 1);
  assert.equal(out.owned[0].ownerId, "priya");
});

const sortedByCustomer = `
Jordan Lee: The sync errors are back. Sam will sort that out, I'm sure.
Priya Shah: Let's look at the rollout plan first.
Jordan Lee: Fine by me.
`;

test("a customer saying a consultant will do it doesn't make it theirs", () => {
  const out = vetActionItems(
    [item({ title: "Sort out Northwind's sync errors", owner: "Sam Ortiz", quote: "Sam will sort that out, I'm sure." })],
    team,
    people,
    { kind: "call", text: sortedByCustomer, presentIds: new Set(["priya", "sam"]) },
  );
  assert.equal(out.owned.length, 0);
  assert.equal(out.rejected[0].reason, "nobody at RevOptics said it");
});

const mentions = `
Priya Shah: I'll ask Sam about the historical import and come back to you.
Jordan Lee: Thanks.
Priya Shah: And Sam will take care of the BDR configuration this week.
`;

test("being mentioned isn't ownership - 'I'll ask Sam' isn't Sam's", () => {
  const out = vetActionItems(
    [item({ title: "Run Northwind's historical import", owner: "Sam Ortiz", quote: "I'll ask Sam about the historical import and come back to you." })],
    team,
    people,
    { kind: "call", text: mentions, presentIds: new Set(["priya", "sam"]) },
  );
  assert.equal(out.owned.length, 0);
  assert.match(out.unidentified[0].reason, /doesn't show Sam Ortiz taking it on/);
});

test("a colleague assigning it by name - 'Sam will take care of' - is Sam's", () => {
  const out = vetActionItems(
    [item({ title: "Configure Northwind's BDR setup", owner: "Sam Ortiz", quote: "Sam will take care of the BDR configuration this week." })],
    team,
    people,
    { kind: "call", text: mentions, presentIds: new Set(["priya", "sam"]) },
  );
  assert.equal(out.owned[0]?.ownerId, "sam");
});

// --------------------------------------------------- team-level in an email

const teamRecap = `Hi Jordan,

Recap of today:
- On our side, we'll build the pipeline dashboard for your leadership team.
- I'll send over the sequence templates by Friday.

Thanks,
Priya`;
const fromPriyaTeam = { kind: "email" as const, text: teamRecap, presentIds: new Set(["priya"]), senderId: "priya" };

test("'on our side, we'll build...' is the team's - held, not given to the sender", () => {
  const out = vetActionItems(
    [item({ title: "Build Northwind's pipeline dashboard", owner: null, quote: "On our side, we'll build the pipeline dashboard for your leadership team." })],
    team,
    people,
    fromPriyaTeam,
  );
  assert.equal(out.owned.length, 0);
  assert.equal(out.unidentified.length, 1);
});

test("even if Claude gives the team's commitment to the sender, it isn't hers", () => {
  const out = vetActionItems(
    [item({ title: "Build Northwind's pipeline dashboard", owner: "Priya Shah", quote: "On our side, we'll build the pipeline dashboard for your leadership team." })],
    team,
    people,
    fromPriyaTeam,
  );
  assert.equal(out.owned.length, 0);
});

test("the sender's own 'I'll...' in the same email is hers", () => {
  const out = vetActionItems(
    [item({ title: "Send Northwind the sequence templates", quote: "I'll send over the sequence templates by Friday.", when: "by Friday" })],
    team,
    people,
    fromPriyaTeam,
  );
  assert.equal(out.owned[0]?.ownerId, "priya");
  assert.equal(out.owned[0]?.when, "by Friday");
});

// ------------------------------------------------------------- deadlines

test("a deadline that isn't in the commitment's own words is dropped", () => {
  // The customer's "by Friday" elsewhere in the call isn't the consultant's.
  const out = vetActionItems(
    [item({ title: "Run the historical import after the export", task: "Run the historical import once Jordan sends the export.", owner: "Sam Ortiz", quote: "Once Jordan sends the export, I'll run the historical import.", when: "by Friday" })],
    team,
    people,
    { kind: "call", text: call, presentIds: new Set(["priya", "sam"]) },
  );
  assert.equal(out.owned[0].when, null);
});

test("vague timing is no date; specific timing is kept", () => {
  const said = new Date("2026-11-16T00:00:00Z"); // a Monday
  for (const vague of ["next week", "sometime next week", "early next week", "in a couple of days", "soon", "in a few days", "by next week"]) {
    assert.equal(promisedDate(vague, said), null, vague);
  }
  assert.equal(promisedDate("by Friday", said)?.toISOString().slice(0, 10), "2026-11-20");
  assert.equal(promisedDate("by the end of next week", said)?.toISOString().slice(0, 10), "2026-11-27");
  assert.equal(promisedDate("tomorrow", said)?.toISOString().slice(0, 10), "2026-11-17");
});

// ------------------------------- what was said: accepted, declined, or done

/** One request from the customer, then one reply from Priya. */
const reply = (answer: string) => ({
  kind: "call" as const,
  text: `\nJordan Lee: Can you send the field mapping?\nPriya Shah: ${answer}\nJordan Lee: Thanks.`,
  presentIds: new Set(["priya"]),
});
const answered = (answer: string, when: string | null = null) =>
  vetActionItems(
    [item({ title: "Send Northwind the field mapping", quote: `Can you send the field mapping? ${answer}`, when })],
    team,
    people,
    reply(answer),
  );

test("'I'll send the mapping tomorrow' is a commitment, dated", () => {
  const out = answered("I'll send the mapping tomorrow.", "tomorrow");
  assert.equal(out.owned[0]?.ownerId, "priya");
  assert.equal(out.owned[0]?.when, "tomorrow");
});

test("'I can take care of that.' after a request is a commitment, not a fragment", () => {
  assert.equal(answered("I can take care of that.").owned[0]?.ownerId, "priya");
});

test("'Sure, will do.' after a request is a commitment", () => {
  assert.equal(answered("Sure, will do.").owned[0]?.ownerId, "priya");
});

test("'I can't take care of that.' is not", () => {
  const out = answered("I can't take care of that.");
  assert.equal(out.owned.length, 0);
  assert.equal(out.rejected[0].reason, "declined, already done, or not a commitment");
});

test("'I already sent the mapping.' is work already done, not a commitment", () => {
  assert.equal(answered("I already sent the mapping.").owned.length, 0);
});

test("'I'll see whether that's possible.' is only exploring", () => {
  assert.equal(answered("I'll see whether that's possible.").owned.length, 0);
});

test("...but finding out and promising the answer back is a commitment", () => {
  const out = answered("I'll see whether the API supports it and let you know by Friday.", "by Friday");
  assert.equal(out.owned[0]?.ownerId, "priya");
});

test("'I can't today, but I'll send it tomorrow' commits to tomorrow", () => {
  const out = answered("I can't do it today, but I'll send it tomorrow.", "tomorrow");
  assert.equal(out.owned[0]?.when, "tomorrow");
});

test("a bare 'Sure.' that answers nothing commits to nothing", () => {
  const out = vetActionItems(
    [item({ title: "Send Northwind the field mapping", quote: "Sure." })],
    team,
    people,
    { kind: "call", text: "\nPriya Shah: The mapping looks right to me.\nJordan Lee: Great.\nPriya Shah: Sure.", presentIds: new Set(["priya"]) },
  );
  assert.equal(out.owned.length, 0);
});

// ---------------------------------------------- an email describing others

test("'I spoke with Ethan, and his team will configure the field' isn't the sender's", () => {
  const text = "Hi Ethan,\n\nI spoke with Ethan, and his team will configure the field.\n\nThanks";
  const out = vetActionItems(
    [item({ title: "Configure the Region field", quote: "I spoke with Ethan, and his team will configure the field." })],
    team,
    people,
    { kind: "email", text, presentIds: new Set(["priya"]), senderId: "priya" },
  );
  assert.equal(out.owned.length, 0);
});

// --------------------------------------------- which speaker said the quote

const shared = `
Sam Ortiz: I'll send you the notes from last week.
Jordan Lee: Can you also send the field mapping?
Priya Shah: Sure, I'll send you the field mapping tomorrow.
Jordan Lee: Great.
`;

test("a phrase someone else also said doesn't move the quote to them", () => {
  const out = vetActionItems(
    [item({ title: "Send Northwind the field mapping", owner: "Sam Ortiz", quote: "Sure, I'll send you the field mapping tomorrow." })],
    team,
    people,
    { kind: "call", text: shared, presentIds: new Set(["priya", "sam"]) },
  );
  assert.equal(out.owned.length, 0);
});

const repeated = `
Priya Shah: Sounds good, will do.
Jordan Lee: Can you send the field mapping?
Sam Ortiz: Sounds good, will do.
Jordan Lee: Thanks.
`;

test("the same short answer said twice belongs to whoever answered the request", () => {
  const quote = "Can you send the field mapping? Sounds good, will do.";
  const src = { kind: "call" as const, text: repeated, presentIds: new Set(["priya", "sam"]) };
  assert.equal(vetActionItems([item({ owner: "Sam Ortiz", quote })], team, people, src).owned[0]?.ownerId, "sam");
  assert.equal(vetActionItems([item({ owner: "Priya Shah", quote })], team, people, src).owned.length, 0);
});

test("an unpunctuated request and answer is still placed, and dated", () => {
  const text = "\nJordan Lee: so can you send the field mapping over\nPriya Shah: sure I'll send the field mapping tomorrow\nJordan Lee: great thanks";
  const out = vetActionItems(
    [item({ quote: "can you send the field mapping over sure I'll send the field mapping tomorrow", when: "tomorrow" })],
    team,
    people,
    { kind: "call", text, presentIds: new Set(["priya"]) },
  );
  assert.equal(out.owned[0]?.ownerId, "priya");
  assert.equal(out.owned[0]?.when, "tomorrow");
});

// ------------------------------------------------------- whose deadline

test("the customer's deadline in the same quote isn't the consultant's", () => {
  const text = "\nJordan Lee: We'll send the export by Friday.\nSam Ortiz: Once it's in, I'll run the historical import.\nJordan Lee: Perfect.";
  const out = vetActionItems(
    [item({ title: "Run Northwind's historical import", owner: "Sam Ortiz", quote: "We'll send the export by Friday. Once it's in, I'll run the historical import.", when: "by Friday" })],
    team,
    people,
    { kind: "call", text, presentIds: new Set(["priya", "sam"]) },
  );
  assert.equal(out.owned[0]?.ownerId, "sam");
  assert.equal(out.owned[0]?.when, null);
});

// ---------------------------------------- natural acceptance, not a phrasebook

const askReport = "Can you send the updated report?";
const acceptReport = (answer: string, ask = askReport, when: string | null = null) =>
  vetActionItems(
    [item({ title: "Send Northwind the updated report", task: "Send Northwind the updated report.", quote: `${ask} ${answer}`, when })],
    team,
    people,
    { kind: "call", text: `\nJordan Lee: ${ask}\nPriya Shah: ${answer}\nJordan Lee: Thanks.`, presentIds: new Set(["priya"]) },
  );

for (const answer of [
  "That's on me.",
  "I've got that.",
  "Leave that with me.",
  "Consider it done.",
  "Absolutely, I'll handle it.",
  "Sure, I can get that over to you.",
  "Absolutely.",
  "Will do.",
]) {
  test(`'${answer}' in answer to a request is a commitment`, () => {
    assert.equal(acceptReport(answer).owned[0]?.ownerId, "priya");
  });
}

test("'Consider it done.' answering nothing commits to nothing", () => {
  const out = vetActionItems(
    [item({ quote: "Consider it done." })],
    team,
    people,
    { kind: "call", text: "\nJordan Lee: The mapping looks good.\nPriya Shah: Consider it done.", presentIds: new Set(["priya"]) },
  );
  assert.equal(out.owned.length, 0);
});

test("'Leave the mapping with me.' in a recap is the sender's", () => {
  const text = "Hi Jordan,\n\nLeave the field mapping with me - I'll have it to you by Friday.\n\nThanks";
  const out = vetActionItems(
    [item({ quote: "Leave the field mapping with me - I'll have it to you by Friday.", when: "by Friday" })],
    team,
    people,
    { kind: "email", text, presentIds: new Set(["priya"]), senderId: "priya" },
  );
  assert.equal(out.owned[0]?.ownerId, "priya");
  assert.equal(out.owned[0]?.when, "by Friday");
});

// ------------------------------------------------ deadlines in the request

const fridayAsk = "Can you send the updated report by Friday?";

test("a deadline in the customer's request, plainly accepted, is promised", () => {
  const out = acceptReport("Absolutely, I'll send that over.", fridayAsk, "by Friday");
  assert.equal(out.owned[0]?.when, "by Friday");
});

test("'I'll see whether I can do that by Friday' isn't a Friday promise", () => {
  const out = acceptReport("I'll see whether I can do that by Friday.", fridayAsk, "by Friday");
  assert.ok(out.owned.length === 0 || out.owned[0].when === null);
});

test("'I'll try to get it over by Friday' is a commitment, but not to Friday", () => {
  const out = acceptReport("I'll try to get it over to you by Friday.", fridayAsk, "by Friday");
  assert.equal(out.owned[0]?.ownerId, "priya");
  assert.equal(out.owned[0]?.when, null);
});

test("a time the consultant names themselves wins over the one asked for", () => {
  const out = acceptReport("I'll send it on Monday.", fridayAsk, "by Friday");
  assert.equal(out.owned[0]?.when, null);
  assert.equal(acceptReport("I'll send it on Monday.", fridayAsk, "on Monday").owned[0]?.when, "on Monday");
});

// -------------------------------------------- two deliverables, one sentence

const twoThings = "I'll send the updated sequences tomorrow and the reporting recommendations by Friday.";
const twoThingsCall = {
  kind: "call" as const,
  text: `\nJordan Lee: What's next from your side?\nPriya Shah: ${twoThings}\nJordan Lee: Great.`,
  presentIds: new Set(["priya"]),
};

test("two deliverables in one sentence are two commitments, each with its own date", () => {
  const out = vetActionItems(
    [
      item({ title: "Send Northwind the updated sequences", task: "Send Northwind the updated sequences.", quote: twoThings, when: "tomorrow" }),
      item({ title: "Send Northwind the reporting recommendations", task: "Send Northwind the reporting recommendations.", quote: twoThings, when: "by Friday" }),
    ],
    team,
    people,
    twoThingsCall,
  );
  assert.deepEqual(out.owned.map((o) => o.when), ["tomorrow", "by Friday"]);
});

test("...and the other deliverable's date is never attached to this one", () => {
  const out = vetActionItems(
    [item({ title: "Send Northwind the updated sequences", task: "Send Northwind the updated sequences.", quote: twoThings, when: "by Friday" })],
    team,
    people,
    twoThingsCall,
  );
  assert.equal(out.owned[0]?.when, null);
});
