"use client";

import { useOptimistic, useTransition } from "react";
import { setNotificationAction } from "@/app/actions/profile";

/**
 * One switch, saved the moment it moves.
 *
 * Optimistic, because the thing a person does immediately after flipping a
 * notification off is close the tab, and a toggle that snaps back for half a
 * second reads as "that didn't work".
 */
export function NotificationToggle({
  which,
  on,
  label,
  hint,
}: {
  which: "dailyDigest" | "meetingNudges";
  on: boolean;
  label: string;
  hint: string;
}) {
  const [shown, setShown] = useOptimistic(on);
  const [, start] = useTransition();

  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-ink-900">{label}</span>
        <span className="block text-xs text-ink-500">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={shown}
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
        onChange={(e) => {
          const next = e.target.checked;
          start(async () => {
            setShown(next);
            const body = new FormData();
            body.set("which", which);
            body.set("on", String(next));
            await setNotificationAction(body);
          });
        }}
      />
    </label>
  );
}
