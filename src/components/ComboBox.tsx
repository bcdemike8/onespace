"use client";

import { useId, useMemo, useRef, useState } from "react";

export interface ComboOption {
  value: string;
  label: string;
  /** A second line — the client a project belongs to, say. Searched too. */
  hint?: string;
}

/**
 * A dropdown you can type into.
 *
 * A plain <select> is fine for eight options and unusable at a thousand: the
 * browser's own type-ahead only matches from the first character, so finding
 * "Great Minds" in the client list means scrolling past everything from
 * (HOPCo) to Acoustic. Every long list in here now uses this instead.
 *
 * It submits through a hidden input, so the form around it does not know or
 * care that this is a combobox — no JSON, no controlled form state, and it
 * posts the same field a <select> did.
 *
 * Keyboard: type to narrow, arrows to move, Enter to take the highlighted
 * one, Escape to close. Enter on an empty list does nothing rather than
 * guessing.
 */
export function ComboBox({
  name,
  label,
  options,
  value = null,
  placeholder = "Type to search…",
  required = false,
  onChange,
  className = "",
}: {
  name: string;
  /** Omit to render without one — inside a row that is already labelled. */
  label?: string;
  options: ComboOption[];
  value?: string | null;
  placeholder?: string;
  required?: boolean;
  /** For a field that depends on this one, like a task list under a project. */
  onChange?: (value: string) => void;
  className?: string;
}) {
  const id = useId();
  const [chosen, setChosen] = useState<string | null>(value);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === chosen) ?? null;

  /**
   * Every word has to match, somewhere.
   *
   * "great sync" finds "Great Minds — Outreach Sync" without needing the
   * words in that order, which is how people actually half-remember the name
   * of a project.
   */
  const matches = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const hit = (o: ComboOption) => {
      const haystack = `${o.label} ${o.hint ?? ""}`.toLowerCase();
      return words.every((w) => haystack.includes(w));
    };
    // Capped: a thousand list items is a slow render for a list nobody reads
    // past the first few of. Narrow the search instead.
    return (words.length === 0 ? options : options.filter(hit)).slice(0, 60);
  }, [options, query]);

  const take = (option: ComboOption) => {
    setChosen(option.value);
    setQuery("");
    setOpen(false);
    onChange?.(option.value);
  };

  const clear = () => {
    setChosen(null);
    setQuery("");
    onChange?.("");
    // Straight back into typing: clearing is nearly always the first half of
    // choosing something else.
    setTimeout(() => input.current?.focus(), 0);
  };

  return (
    <div className={className}>
      {label ? (
        <label className="label" htmlFor={`${id}-input`}>
          {label}
        </label>
      ) : null}

      {/* What the form actually posts. Required lives here so an empty
          combobox fails validation the way an empty select would. */}
      <input
        type="hidden"
        name={name}
        value={chosen ?? ""}
        required={required}
      />

      {selected ? (
        <div className="flex items-center gap-1">
          <span className="input flex-1 truncate bg-ink-50">{selected.label}</span>
          <button
            type="button"
            onClick={clear}
            className="btn-ghost btn-sm shrink-0"
            aria-label={label ? `Clear ${label}` : "Clear"}
          >
            ×
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            ref={input}
            id={`${id}-input`}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            // A blur fires before the click on a list item, which would close
            // the list out from under the pointer. Wait a tick.
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                setOpen(true);
                setActive((i) => {
                  const next = e.key === "ArrowDown" ? i + 1 : i - 1;
                  return Math.max(0, Math.min(matches.length - 1, next));
                });
              } else if (e.key === "Enter") {
                // Never submit the form from here: Enter in a search box
                // means "take this one", and submitting a half-filled form
                // instead is the most annoying possible reading of it.
                e.preventDefault();
                const pick = matches[active];
                if (pick) take(pick);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder={placeholder}
            className="input"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-autocomplete="list"
            autoComplete="off"
          />

          {open ? (
            <ul
              id={`${id}-list`}
              role="listbox"
              className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-ink-200 bg-white py-1 shadow-lg"
            >
              {matches.length === 0 ? (
                <li className="px-3 py-2 text-sm text-ink-500">
                  Nothing matches “{query.trim()}”.
                </li>
              ) : (
                matches.map((o, i) => (
                  <li key={o.value}>
                    <button
                      type="button"
                      // Stops the input's blur firing before this click.
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => take(o)}
                      className={`block w-full px-3 py-1.5 text-left text-sm ${
                        i === active ? "bg-brand-50 text-brand-900" : "text-ink-800"
                      }`}
                    >
                      {o.label}
                      {o.hint ? (
                        <span className="block text-xs text-ink-500">{o.hint}</span>
                      ) : null}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
