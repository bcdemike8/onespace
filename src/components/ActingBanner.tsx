import { stopActingAsAction } from "@/app/actions/people";

/**
 * The strip that says you are not yourself right now.
 *
 * Loud on purpose, on every page, and never dismissible. Everything typed
 * while acting is recorded as the colleague — their name on the status
 * update, their calendar synced, their hours. Somebody who forgets they are
 * acting writes into the wrong account, so the cost of the banner being
 * noisy is far below the cost of it being missable.
 */
export function ActingBanner({
  actingAs,
  adminName,
}: {
  actingAs: string;
  adminName: string;
}) {
  return (
    <div className="no-print sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-bad-700 px-4 py-2 text-center text-xs text-white">
      <span>
        Acting as <strong>{actingAs}</strong> — you are seeing OneSpace exactly
        as they do, and anything you do here is recorded as them.
      </span>
      <form action={stopActingAsAction}>
        <button
          type="submit"
          className="rounded-md bg-white/20 px-2 py-0.5 font-medium hover:bg-white/30"
        >
          Stop acting, back to {adminName}
        </button>
      </form>
    </div>
  );
}
