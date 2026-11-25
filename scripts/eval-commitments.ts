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
 * call write-up per case - about fifteen. Reads nothing from the database.
 * Every name and company here is made up; this file is in a public repository.
 */
import "./load-env";
import { readRecap, readTranscript, type AiActionItem } from "@/lib/ai/summarise";
import { buildNameIndex } from "@/lib/commitments/owner";
import { promisedDate, vetActionItems } from "@/lib/commitments/pipeline";

const people = [
  { id: "priya", name: "Priya Shah" },
  { id: "sam", name: "Sam Ortiz" },
  { id: "dana", name: "Dana Whitfield-Ross" },
];
const team = buildNameIndex(people);
const names = people.map((p) => p.name);
const CLIENT = "Northwind";

interface Expected {
  owner: string;
  /** Any of these words in the title or task shows it's the right item. */
  about: string[];
  /** True when a deadline was given and should come through as a date. */
  dated?: boolean;
}

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
    expect: [{ owner: "priya", about: ["investigat"] }],
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
    expect: [{ owner: "sam", about: ["configur"] }],
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
    expect: [{ owner: "sam", about: ["sequence"], dated: true }],
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
    expect: [{ owner: "priya", about: ["sequence"], dated: true }],
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
      { owner: "priya", about: ["playbook"], dated: true },
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
    expect: [{ owner: "sam", about: ["import"] }],
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
    expect: [{ owner: "priya", about: ["guide", "how-to"] }],
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
];

async function readCase(c: Case): Promise<AiActionItem[]> {
  const by = people.find((p) => p.id === c.by)!;
  if (c.kind === "recap") {
    const r = await readRecap(
      c.text,
      { subject: `${CLIENT} + RevOptics recap`, sentAt: new Date(), sender: by.name, client: CLIENT, team: names },
      120_000,
    );
    if (!r.items) throw new Error(r.reason ?? "no reading");
    return r.items;
  }
  const r = await readTranscript(
    c.text,
    { title: `${CLIENT} weekly`, when: new Date(), client: CLIENT, team: names },
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
  let falsePositives = 0;
  let falseNegatives = 0;

  for (const c of cases) {
    let items: AiActionItem[];
    try {
      items = await readCase(c);
    } catch (e) {
      console.log(`\n✗ ${c.name}\n    Claude couldn't read it: ${e instanceof Error ? e.message : e}`);
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
    const out = vetActionItems(items, team, people, { text: c.text, presentIds: present });

    const left = [...c.expect];
    const extra: string[] = [];
    for (const o of out.owned) {
      const hay = `${o.title} ${o.task}`.toLowerCase();
      const i = left.findIndex(
        (e) => e.owner === o.ownerId && e.about.some((w) => hay.includes(w.toLowerCase())),
      );
      if (i === -1) {
        extra.push(`${o.ownerId}: ${o.title}`);
        continue;
      }
      const e = left.splice(i, 1)[0];
      const dated = promisedDate(o.when, new Date()) !== null;
      if (Boolean(e.dated) !== dated) {
        extra.push(`${o.ownerId}: ${o.title} - deadline ${dated ? "invented" : "missed"} (when: ${o.when ?? "none"})`);
      }
    }

    const ok = extra.length === 0 && left.length === 0;
    if (ok) passed += 1;
    falsePositives += extra.length;
    falseNegatives += left.length;

    console.log(`\n${ok ? "✓" : "✗"} ${c.name}`);
    for (const o of out.owned) console.log(`    → ${o.ownerId}: ${o.title}\n      "${o.quote}"`);
    for (const x of extra) console.log(`    ✗ shouldn't be there: ${x}`);
    for (const m of left) console.log(`    ✗ missed: ${m.owner} - ${m.about.join("/")}`);
    for (const u of out.unidentified) console.log(`    · held back (owner): ${u.item.title} - ${u.reason}`);
    for (const r of out.rejected) {
      if (r.item.ours) console.log(`    · rejected: ${r.item.title} - ${r.reason}`);
    }
  }

  console.log(
    `\n${passed}/${cases.length} cases right · ${falsePositives} wrong item(s) shown · ${falseNegatives} real commitment(s) missed`,
  );
  process.exit(passed === cases.length ? 0 : 1);
}

main();
