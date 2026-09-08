import "server-only";
import { db } from "@/lib/db";

export interface RateSnapshot {
  billRateCents: number;
  costRateCents: number;
  billable: boolean;
}

/**
 * Work out the rates to stamp onto a time entry at the moment it's written.
 *
 * Bill rate: the project's override if it has one, otherwise the person's
 * default rate. Cost rate: always the person's real cost — that's what makes
 * budget-vs-actual honest.
 *
 * Snapshotting matters: without it, giving someone a raise would silently
 * rewrite every historical report and every invoice you've already sent.
 */
export async function resolveRates(
  userId: string,
  projectId: string,
  billableOverride?: boolean,
): Promise<RateSnapshot> {
  const [user, project] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { billRateCents: true, costRateCents: true },
    }),
    db.project.findUnique({
      where: { id: projectId },
      select: { billRateCents: true, billingType: true },
    }),
  ]);

  if (!user) throw new Error("User not found.");
  if (!project) throw new Error("Project not found.");

  // A non-billable project cannot produce billable time, whatever the form
  // said — the override only narrows, it never widens.
  const projectIsBillable = project.billingType !== "NON_BILLABLE";

  return {
    billRateCents: project.billRateCents ?? user.billRateCents,
    costRateCents: user.costRateCents,
    billable: projectIsBillable && (billableOverride ?? true),
  };
}
