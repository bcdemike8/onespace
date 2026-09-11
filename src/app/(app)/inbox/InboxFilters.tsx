"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  inboxHref,
  REPLY_FILTERS,
  type FilterGroup,
  type ReplyFilter,
} from "@/lib/inbox-filters";

interface Current {
  who?: string;
  show?: string;
  which?: string;
  reply?: string;
}

/**
 * Which engagement, and whose turn it is.
 *
 * A GET form underneath, so it still works if the client JS hasn't loaded -
 * but picking from the dropdown navigates straight away rather than making
 * anyone hunt for an Apply button.
 */
export function ProjectFilter({
  groups,
  current,
}: {
  groups: FilterGroup[];
  current: Current;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (groups.length === 0) return null;

  return (
    <form action="/inbox" className="flex items-center gap-2">
      {current.who ? (
        <input type="hidden" name="who" value={current.who} />
      ) : null}
      {current.show ? (
        <input type="hidden" name="show" value={current.show} />
      ) : null}
      {current.reply && current.reply !== "all" ? (
        <input type="hidden" name="reply" value={current.reply} />
      ) : null}

      <label className="sr-only" htmlFor="which">
        Project
      </label>
      <select
        id="which"
        name="which"
        defaultValue={current.which ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          start(() =>
            router.push(inboxHref(current, { which: value || null })),
          );
        }}
        className={`input w-[15rem] py-1 text-sm ${pending ? "opacity-60" : ""}`}
      >
        <option value="">Every client</option>
        {groups.map((g, i) =>
          g.label ? (
            <optgroup key={g.label} label={g.label}>
              {g.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} ({o.count})
                </option>
              ))}
            </optgroup>
          ) : (
            g.options.map((o) => (
              <option key={`${i}-${o.value}`} value={o.value}>
                {o.label} ({o.count})
              </option>
            ))
          ),
        )}
      </select>

      <button type="submit" className="sr-only">
        Show
      </button>
    </form>
  );
}

/**
 * Whose turn it is to write.
 *
 * Links rather than a second dropdown: three choices, and the counts are
 * worth seeing without opening anything.
 */
export function ReplyFilterTabs({
  current,
  counts,
}: {
  current: Current;
  counts: Record<ReplyFilter, number>;
}) {
  const active = current.reply ?? "all";

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {REPLY_FILTERS.map((f) => (
        <Link
          key={f.value}
          href={inboxHref(current, { reply: f.value })}
          className={
            active === f.value ? "btn-secondary btn-sm" : "btn-ghost btn-sm"
          }
        >
          {f.label}
          <span className="ml-1.5 text-ink-400 tnum">{counts[f.value]}</span>
        </Link>
      ))}
    </div>
  );
}
