/**
 * How accurately are commitments found? Measured against the real model.
 *
 *   npm run eval:commitments
 *
 * The automated tests prove the checks around Claude work - a customer's task,
 * an invented quote or an absent owner never reaches My work, whatever Claude
 * says. They can't prove Claude reads real conversations well. This does: it
 * sends realistic calls and recap emails to Claude with the same instructions
 * the app uses, runs the answers through the same checks, and compares what
 * would reach each consultant's My work with what should.
 *
 * Needs ANTHROPIC_API_KEY (in .env or the environment). Costs roughly one
 * call write-up per case - about thirty. Reads nothing from the database.
 * Every name and company here is made up; this file is in a public repository.
 */
import "./load-env";
import { readRecap, readTranscript, type AiActionItem } from "@/lib/ai/summarise";
import { buildNameIndex } from "@/lib/commitments/owner";
import { vetActionItems } from "@/lib/commitments/pipeline";
import { scoreCase, type Expected } from "./eval-score";

const people = [
  { id: "priya", name: "Priya Shah" },
  { id: "sam", name: "Sam Ortiz" },
  { id: "dana", name: "Dana Whitfield-Ross" },
];
const team = buildNameIndex(people);
const names = people.map((p) => p.name);
const CLIENT = "Northwind";

/** Every call and recap happens on Monday 16 November 2026, so deadlines are exact. */
const SAID = new Date("2026-11-16T15:00:00Z");

interface Case {
  name: string;
  kind: "call" | "recap";
  /** The host of the call, or the sender of the recap. */
  by: string;
  text: string;
  expect: Expected[];
}

const RECAP_16_NOV = `Hi Jordan,

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

const cases: Case[] = [
  // -------------------------------------------------------------- recaps
  {
    name: "Recap: the 16 Nov shape - every item is the customer's",
    kind: "recap",
    by: "priya",
    text: RECAP_16_NOV,
    expect: [],
  },
  {
    name: "Recap: the same, plus an explicit 'I'll investigate...'",
    kind: "recap",
    by: "priya",
    text: `${RECAP_16_NOV}

On my side, I'll investigate why completed Outreach tasks aren't associating with Salesforce Contact records and share my findings with Jordan.`,
    expect: [{ owner: "priya", about: ["investigat", "contact"] }],
  },
  {
    name: "Recap: the sender commits a named colleague",
    kind: "recap",
    by: "priya",
    text: `Hi Jordan,

Great session today. Quick recap:
- Sam will take care of the Outreach configuration for the new BDR team.
- Jordan to confirm which territories the BDRs will cover.

Talk soon,
Priya`,
    expect: [{ owner: "sam", about: ["configur", "bdr"] }],
  },
  {
    name: "Recap: plans, shared 'we' and work already done",
    kind: "recap",
    by: "priya",
    text: `Hi Jordan,

Recap of today's call:
- We'll want to test this with a small group first.
- We need to confirm the mapping before go-live.
- We'll discuss the reporting during the next session.
- The next step is reviewing governance.
- We already completed the configuration of the BDR profile.

Thanks,
Priya`,
    expect: [],
  },
  {
    name: "Recap: a promised deliverable with a deadline",
    kind: "recap",
    by: "sam",
    text: `Hi Jordan,

Thanks for the time today. Next steps:
1. I'll get the updated sequences over to you by Friday.
2. Your team will review them and share feedback by next Wednesday.

Best,
Sam`,
    expect: [{ owner: "sam", about: ["sequence"], due: "2026-11-20" }],
  },

  // --------------------------------------------------------------- calls
  {
    name: "Call: a consultant explicitly accepts a customer request",
    kind: "call",
    by: "priya",
    text: `
Priya Shah: Thanks for joining, Jordan. Where did we land on the sequences?
Jordan Lee: They look close. Could you send us the updated sequence templates with the new persona tiers?
Priya Shah: Sure, I'll get the updated sequences over to you by Friday.
Jordan Lee: Perfect, thank you.
Priya Shah: Anything else on your side before we wrap?
Jordan Lee: No, that's everything for today.`,
    expect: [{ owner: "priya", about: ["sequence", "persona"], due: "2026-11-20" }],
  },
  {
    name: "Call: a customer asks, the consultant doesn't agree",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: Could someone look at the dashboard filters at some point? They're a bit off.
Priya Shah: Let's see how the rollout goes first and come back to that.
Jordan Lee: Sure, makes sense. The rollout is the priority.
Priya Shah: Agreed. So for this week the focus stays on getting the BDRs live.
Jordan Lee: Sounds good, talk next week.`,
    expect: [],
  },
  {
    name: "Call: the customer assigns themselves the work",
    kind: "call",
    by: "priya",
    text: `
Priya Shah: The last piece is the Region field on the Lead object.
Jordan Lee: We'll configure the Region field ourselves on our side. Ethan can own that.
Ethan Park: Yes, I'll create it and map it this week.
Priya Shah: Great, that works. Let me know if you hit anything odd.
Jordan Lee: Will do. Thanks, Priya.`,
    expect: [],
  },
  {
    name: "Call: a consultant commits on another consultant's call",
    kind: "call",
    by: "priya",
    text: `
Priya Shah: Sam's joining us today for the sync issues.
Jordan Lee: The sync errors are still happening every morning. Can someone take that?
Sam Ortiz: I can take care of that. I'll work with Outreach Support to resolve the sync errors and update you once I hear back.
Jordan Lee: Thank you, Sam.
Priya Shah: Great. Anything else on the sync side?
Jordan Lee: No, that's the main one.`,
    expect: [{ owner: "sam", about: ["sync", "support"] }],
  },
  {
    name: "Call: two consultants each take something on",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: We need the playbook and the user provisioning sorted before launch.
Priya Shah: I'll own the playbook piece and send a draft by end of next week.
Sam Ortiz: And I'll handle provisioning the twelve new users in Outreach.
Jordan Lee: Brilliant, that covers it.
Priya Shah: We'll reconvene once both are done.`,
    expect: [
      { owner: "priya", about: ["playbook"], due: "2026-11-27" },
      { owner: "sam", about: ["provision", "user"] },
    ],
  },
  {
    name: "Call: a commitment that waits on the customer",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: We still want the historical activity in Outreach.
Sam Ortiz: Once you send the export from Salesforce, I'll run the historical import.
Jordan Lee: I'll get the export to you tomorrow.
Sam Ortiz: Perfect. I'll confirm when it's loaded.
Priya Shah: Great, that closes out the data side for now.`,
    expect: [{ owner: "sam", about: ["historical", "import"] }],
  },
  {
    name: "Call: things already done during the meeting",
    kind: "call",
    by: "priya",
    text: `
Priya Shah: I've just updated the field mapping while we were talking, so that's done.
Jordan Lee: Great, I can see it now.
Priya Shah: And we already completed the configuration of the BDR profile last week.
Jordan Lee: Yes, the team has been using it. No issues so far.
Priya Shah: Good. Then we're in good shape for the launch.`,
    expect: [],
  },
  {
    name: "Call: a real commitment with no date",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: The reps keep asking how to use the new research agents.
Priya Shah: I'll put together a short how-to guide on the research agents for your reps.
Jordan Lee: That would help a lot.
Priya Shah: Happy to. I'll share it once it's ready.
Jordan Lee: Thanks. That's all from me.`,
    expect: [{ owner: "priya", about: ["guide", "research"] }],
  },
  {
    name: "Call: talk of next steps, nobody takes them",
    kind: "call",
    by: "priya",
    text: `
Priya Shah: So the next step is probably reviewing governance at some point.
Jordan Lee: Yes, and we'll want to test the sequences with a small group.
Priya Shah: We need to confirm the mapping too. We'll discuss all of that during the next session.
Jordan Lee: Sounds like a plan. Same time next week?
Priya Shah: Same time next week.`,
    expect: [],
  },
  {
    name: "Call: a customer who shares a consultant's first name",
    kind: "call",
    by: "priya",
    text: `
Priya Shah: Sam Brown, thanks for joining from the ops side.
Sam Brown: Happy to. I'll send over the user list for provisioning today.
Priya Shah: Great. Once we have it, we're ready to go.
Sam Brown: It'll be with you by end of day.
Priya Shah: Perfect, thanks Sam.`,
    expect: [],
  },

  // ---------------------------------- ownership and dates, the harder cases
  {
    name: "Recap: a team-level commitment isn't the sender's",
    kind: "recap",
    by: "priya",
    text: `Hi Jordan,

Recap of today:
- On our side, we'll build the pipeline dashboard for your leadership team.
- Your team will confirm the stage definitions before we start.

Thanks,
Priya`,
    expect: [],
  },
  {
    name: "Recap: the sender commits a named colleague, with a deadline",
    kind: "recap",
    by: "sam",
    text: `Hi Jordan,

Thanks for today. Next steps:
- Priya will share the reporting templates by Thursday.
- Jordan to send the list of report owners.

Best,
Sam`,
    expect: [{ owner: "priya", about: ["report", "template"], due: "2026-11-19" }],
  },
  {
    name: "Call: the customer says a consultant will do it; the consultant never agrees",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: The sync errors are back again this morning. Sam will sort that out, I'm sure.
Priya Shah: Let's look at the rollout plan first and come back to the sync.
Jordan Lee: Fine by me. The rollout is more urgent anyway.
Priya Shah: Agreed. Let's walk through the rollout dates.
Jordan Lee: Sounds good.`,
    expect: [],
  },
  {
    name: "Call: mentioning a colleague isn't giving them the work",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: When can the historical import run?
Priya Shah: I'll check with Sam on the import timing and get back to you tomorrow.
Jordan Lee: Great, thanks.
Priya Shah: Sam knows that part of the setup best.
Jordan Lee: Makes sense.`,
    expect: [{ owner: "priya", about: ["import", "timing"], due: "2026-11-17" }],
  },
  {
    name: "Call: a customer's deadline doesn't become the consultant's",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: We'll send the Salesforce export by Friday.
Sam Ortiz: Once it's in, I'll run the historical import and confirm the record counts.
Jordan Lee: Perfect.
Priya Shah: Great, that closes out the data side.
Jordan Lee: Thanks both.`,
    expect: [{ owner: "sam", about: ["historical", "import"] }],
  },
  {
    name: "Call: vague timing stays undated",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: Is the revised playbook coming?
Priya Shah: Yes, I'll send the revised playbook sometime next week.
Jordan Lee: That works for us.
Priya Shah: I'll include the new objection handling section too.
Jordan Lee: Great, thank you.`,
    expect: [{ owner: "priya", about: ["playbook"] }],
  },
  {
    name: "Call: a request bounced between speakers, then one consultant takes it",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: Could someone rebuild the BDR dashboard? The filters are wrong.
Priya Shah: That one's tricky - Sam, is that something you could look at?
Sam Ortiz: Yes, I can take care of that. I'll rebuild the BDR dashboard with the corrected filters.
Jordan Lee: Thank you, Sam.
Priya Shah: Great, that's settled.`,
    expect: [{ owner: "sam", about: ["dashboard", "filter"] }],
  },
  {
    name: "Call: a consultant declines a request",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: Could you also build the territory reports for the regional leads?
Priya Shah: I can't take that on in this phase - it's outside the scope we agreed.
Jordan Lee: Understood, we'll look at it internally.
Priya Shah: Happy to scope it for the next phase if useful.
Jordan Lee: Let's talk about that later.`,
    expect: [],
  },
  {
    name: "Call: work described as already done",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: Did the field mapping go over?
Priya Shah: Yes, I already sent the mapping yesterday, and I updated the stage values too.
Jordan Lee: Great, I'll check my inbox.
Priya Shah: Let me know if anything looks off.
Jordan Lee: Will do.`,
    expect: [],
  },
  {
    name: "Call: only looking into it, nothing promised back",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: Is it possible to sync the custom objects too?
Priya Shah: I'll see whether that's possible. It depends a lot on your Salesforce edition.
Jordan Lee: Okay, no rush on that one.
Priya Shah: Sure. Let's focus on the core objects first.
Jordan Lee: Agreed.`,
    expect: [],
  },
  {
    name: "Recap: the sender describes the customer's work in the first person",
    kind: "recap",
    by: "priya",
    text: `Hi Ethan,

Following up on today. I spoke with Jordan, and his team will configure the Region field this week. I also confirmed with your admin that the sandbox refresh is scheduled.

Thanks,
Priya`,
    expect: [],
  },
  {
    name: "Call: natural acceptance - 'That's on me' / 'Leave that with me'",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: Who's updating the persona tiers in the sequences?
Priya Shah: That's on me. I'll have them updated before the training.
Jordan Lee: And can someone send the admin guide to Ethan?
Sam Ortiz: Leave that with me.
Jordan Lee: Perfect, thanks both.`,
    expect: [
      { owner: "priya", about: ["persona", "sequence"] },
      { owner: "sam", about: ["admin", "guide"] },
    ],
  },
  {
    name: "Call: a deadline asked for and plainly accepted",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: Can you send the updated pipeline report by Friday? Leadership wants it for Monday.
Priya Shah: Absolutely, I'll send that over.
Jordan Lee: Great, thank you.
Priya Shah: Anything else for this week?
Jordan Lee: No, that's everything.`,
    expect: [{ owner: "priya", about: ["pipeline", "report"], due: "2026-11-20" }],
  },
  {
    name: "Call: two deliverables, two dates, one sentence",
    kind: "call",
    by: "priya",
    text: `
Jordan Lee: What's coming from your side next?
Priya Shah: I'll send the updated sequences tomorrow and the reporting recommendations by Friday.
Jordan Lee: Perfect, that works for us.
Priya Shah: Great. Let me know if the team has questions.
Jordan Lee: Will do.`,
    expect: [
      { owner: "priya", about: ["sequence"], due: "2026-11-17" },
      { owner: "priya", about: ["recommendation"], due: "2026-11-20" },
    ],
  },
];

async function readCase(c: Case): Promise<AiActionItem[]> {
  const by = people.find((p) => p.id === c.by)!;
  if (c.kind === "recap") {
    const r = await readRecap(
      c.text,
      { subject: `${CLIENT} + RevOptics recap`, sentAt: SAID, sender: by.name, client: CLIENT, team: names },
      120_000,
    );
    if (!r.items) throw new Error(r.reason ?? "no reading");
    return r.items;
  }
  const r = await readTranscript(
    c.text,
    { title: `${CLIENT} weekly`, when: SAID, client: CLIENT, team: names },
    180_000,
  );
  if (!r.read) throw new Error(r.reason ?? "no reading");
  return r.read.actionItems;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY isn't set - add it to .env, or run: ANTHROPIC_API_KEY=... npm run eval:commitments");
    process.exit(1);
  }

  let passed = 0;
  let correct = 0;
  let falsePositives = 0;
  let falseNegatives = 0;
  let wrongOwner = 0;
  let wrongDeadline = 0;
  let unread = 0;

  for (const c of cases) {
    let items: AiActionItem[];
    try {
      items = await readCase(c);
    } catch (e) {
      console.log(`\n✗ ${c.name}\n    Claude couldn't read it: ${e instanceof Error ? e.message : e}`);
      unread += 1;
      continue;
    }

    // Who Claude is told was there: for a call, the host and anyone who
    // speaks; for a recap, the sender. As the app does.
    const present = new Set([c.by]);
    if (c.kind === "call") {
      for (const line of c.text.split("\n")) {
        const id = team.match(line.split(":")[0]?.trim());
        if (id) present.add(id);
      }
    }
    const out = vetActionItems(items, team, people, {
      kind: c.kind === "call" ? "call" : "email",
      text: c.text,
      presentIds: present,
      senderId: c.kind === "recap" ? c.by : undefined,
    });

    const score = scoreCase(c.expect, out.owned, SAID);
    correct += score.correct;
    falsePositives += score.falsePositives;
    falseNegatives += score.falseNegatives;
    wrongOwner += score.wrongOwner;
    wrongDeadline += score.wrongDeadline;
    const extra = score.notes;
    const left = score.missed;

    const ok = extra.length === 0 && left.length === 0;
    if (ok) passed += 1;

    console.log(`\n${ok ? "✓" : "✗"} ${c.name}`);
    // Printed in full so a person can judge whether each is really the
    // expected deliverable - the keyword match is only a proxy for that.
    for (const o of out.owned) {
      console.log(`    → ${o.ownerId}: ${o.title}\n      task: ${o.task}\n      quote: "${o.quote}"`);
    }
    for (const x of extra) console.log(`    ✗ ${x}`);
    for (const m of left) console.log(`    ✗ missed: ${m.owner} - ${m.about.join("/")}`);
    for (const u of out.unidentified) console.log(`    · held back (owner): ${u.item.title} - ${u.reason}`);
    for (const r of out.rejected) {
      if (r.item.ours) console.log(`    · rejected: ${r.item.title} - ${r.reason}`);
    }
  }

  const expected = cases.reduce((n, c) => n + c.expect.length, 0);
  console.log(`
${passed}/${cases.length} cases fully right
  ${correct}/${expected} real commitments found, right owner and deadline
  ${falsePositives} wrong item(s) shown (false positives)
  ${falseNegatives} real commitment(s) missed (false negatives)
  ${wrongOwner} on the wrong person
  ${wrongDeadline} with a wrong deadline`);
  if (unread > 0) {
    console.log(`
  ${unread} case(s) NOT READ by Claude - the numbers above don't cover them.
  This is not an accuracy result until every case has been read.`);
  }
  process.exit(passed === cases.length ? 0 : 1);
}

main();
