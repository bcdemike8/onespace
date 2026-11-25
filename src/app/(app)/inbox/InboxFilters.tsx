"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  inboxHref,
  REPLY_FILTERS,
  WHEN_PRESETS,
  type FilterGroup,
  type ReplyFilter,
} from "@/lib/inbox-filters";

interface Current {
  who?: string;
  show?: string;
  which?: string;
  reply?: string;
  when?: string;
  from?: string;
  to?: string;
}

/** The other filters, carried through a GET form so submitting keeps them. */
function Carry({ current, skip }: { current: Current; skip: (keyof Current)[] }) {
  const keys: (keyof Current)[] = ["who", "show", "which", "reply", "when", "from", "to"];
  return (
    <>
      {keys
        .filter((k) => !skip.includes(k) && current[k] && !(k === "reply" && current[k] === "all"))
        .map((k) => (
          <input key={k} type="hidden" name={k} value={current[k]} />
        ))}
    </>
  );
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
      <Carry current={current} skip={["which"]} />

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

/**
 * When the thread was last active.
 *
 * Presets navigate straight away, like the project dropdown. "Custom range"
 * opens two date fields and waits for Apply, because picking the first date
 * of a pair shouldn't reload the page under you before you pick the second.
 * Nothing earlier than the mail start date can be chosen: there's nothing
 * there to find.
 */
export function TimeFilter({
  current,
  earliest,
  latest,
  earliestLabel,
}: {
  current: Current;
  /** YYYY-MM-DD: the mail start date. */
  earliest: string;
  /** YYYY-MM-DD: today. */
  latest: string;
  /** "1 Nov 2026", for the "any time" option. */
  earliestLabel: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const isPreset = WHEN_PRESETS.some((p) => p.value === current.when);
  const initial = isPreset ? current.when! : current.from || current.to ? "custom" : "";
  const [mode, setMode] = useState(initial);

  return (
    <form action="/inbox" className="flex flex-wrap items-center gap-2">
      <Carry current={current} skip={["when", "from", "to"]} />

      <label className="sr-only" htmlFor="when">
        Timeframe
      </label>
      <select
        id="when"
        value={mode}
        onChange={(e) => {
          const value = e.target.value;
          setMode(value);
          if (value === "custom") return;
          start(() =>
            router.push(
              inboxHref(current, { when: value || null, from: null, to: null }),
            ),
          );
        }}
        className={`input w-[11rem] py-1 text-sm ${pending ? "opacity-60" : ""}`}
      >
        <option value="">Since {earliestLabel}</option>
        {WHEN_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
        <option value="custom">Custom range…</option>
      </select>

      {mode === "custom" ? (
        <>
          <label className="sr-only" htmlFor="when-from">
            From
          </label>
          <input
            id="when-from"
            type="date"
            name="from"
            min={earliest}
            max={latest}
            defaultValue={current.from ?? ""}
            className="input w-[9.5rem] py-1 text-sm"
          />
          <span className="text-xs text-ink-500">to</span>
          <label className="sr-only" htmlFor="when-to">
            To
          </label>
          <input
            id="when-to"
            type="date"
            name="to"
            min={earliest}
            max={latest}
            defaultValue={current.to ?? ""}
            className="input w-[9.5rem] py-1 text-sm"
          />
          <button type="submit" className="btn-secondary btn-sm">
            Apply
          </button>
        </>
      ) : null}
    </form>
  );
}
