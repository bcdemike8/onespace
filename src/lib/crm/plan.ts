import type { MappedAccount } from "@/lib/crm/sfdc";

/**
 * What the account import will do, decided before it does any of it.
 *
 * Pure, and separate from the writing, for two reasons. It can be tested
 * against the real 1,037 accounts without a database. And deciding first
 * means the writing is two statements instead of a thousand round trips -
 * which is what made the first version time out before it finished.
 */

export interface ExistingClient {
  id: string;
  name: string;
  sfdcId: string | null;
}

export interface AccountPlan<T> {
  creates: (T & { name: string; sfdcId: string })[];
  updates: { id: string; data: T & { sfdcId?: string | undefined } }[];
  notes: string[];
  skipped: number;
}

/**
 * Three outcomes per row, in order of confidence:
 *
 *   known by Salesforce id  → update it
 *   same name, no id        → adopt it; a client typed in by hand before the
 *                             CRM existed is the same company
 *   name already taken      → create under a distinguished name and say so
 *
 * The last one matters: 16 of the 1,037 accounts share a name with another
 * company, and client names have to be unique. Claiming the first would
 * merge two businesses silently; refusing would stop the import partway.
 */
export function planAccounts<T>(
  accounts: (MappedAccount | null)[],
  existing: ExistingClient[],
  fields: (account: MappedAccount) => T,
): AccountPlan<T> {
  const bySfdc = new Map(
    existing.filter((c) => c.sfdcId).map((c) => [c.sfdcId!, c.id]),
  );
  const byName = new Map(existing.map((c) => [c.name.toLowerCase(), { ...c }]));
  const taken = new Set(existing.map((c) => c.name.toLowerCase()));

  const plan: AccountPlan<T> = { creates: [], updates: [], notes: [], skipped: 0 };

  for (const a of accounts) {
    if (!a) {
      plan.skipped++;
      continue;
    }

    const data = fields(a);

    const known = bySfdc.get(a.sfdcId);
    if (known) {
      // sfdcId is left off deliberately: the row already has it, and writing
      // it again would be a no-op that reads as a change.
      plan.updates.push({ id: known, data: { ...data, sfdcId: undefined } });
      continue;
    }

    const clash = byName.get(a.name.toLowerCase());
    if (clash && !clash.sfdcId) {
      plan.updates.push({ id: clash.id, data: { ...data, sfdcId: a.sfdcId } });
      bySfdc.set(a.sfdcId, clash.id);
      clash.sfdcId = a.sfdcId;
      plan.notes.push(`Matched existing client "${a.name}" to Salesforce by name.`);
      continue;
    }

    let name = a.name;
    if (taken.has(name.toLowerCase())) {
      let n = 2;
      while (taken.has(`${a.name} (${n})`.toLowerCase())) n++;
      name = `${a.name} (${n})`;
      plan.notes.push(
        `Two accounts are called "${a.name}" — imported the second as "${name}".`,
      );
    }
    taken.add(name.toLowerCase());
    plan.creates.push({ ...data, name, sfdcId: a.sfdcId });
  }

  return plan;
}
