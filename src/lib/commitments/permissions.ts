/**
 * Who may decide about an action item, and where a task may go.
 *
 * Pure rules, so they can be tested; the server actions in
 * app/actions/zoom.ts apply them.
 */

/**
 * May this person add or clear this item?
 *
 * An item with an owner is the owner's to decide - the host of the call it
 * came from sees it on the call's page, but clearing a colleague's
 * commitment there would quietly take it off their My work. An item whose
 * owner couldn't be established is on nobody's list; the host, or whoever's
 * mailbox it came from, decides about it deliberately from the call's page.
 * An admin can always act.
 */
export function mayDecide(
  item: { ownerId: string | null; hostId: string },
  user: { id: string; admin: boolean },
): boolean {
  if (user.admin) return true;
  if (item.ownerId) return item.ownerId === user.id;
  return item.hostId === user.id;
}

/** The projects My work offers to add a task to - and the only ones that take one. */
export const OPEN_PROJECT_STATUSES = ["ACTIVE", "ON_HOLD"] as const;

export function takesTasks(status: string): boolean {
  return (OPEN_PROJECT_STATUSES as readonly string[]).includes(status);
}
