"use client";

import { Children, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * A list that shows at most `visible` rows and scrolls for the rest, so a
 * long bucket doesn't push everything below it off the page.
 *
 * The height is measured from the rows themselves - they wrap and grow (a
 * date being edited, a long project name) - rather than guessed. Until the
 * measurement lands the rem fallback keeps the server render close.
 */
export function CappedList({
  children,
  visible = 5,
  className = "",
}: {
  children: ReactNode;
  visible?: number;
  className?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const count = Children.count(children);
  const capped = count > visible;
  const [maxHeight, setMaxHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const list = ref.current;
    if (!list || !capped) {
      setMaxHeight(null);
      return;
    }

    const measure = () => {
      const last = list.children[visible - 1] as HTMLElement | undefined;
      if (last) setMaxHeight(last.offsetTop + last.offsetHeight);
    };
    measure();

    const observer = new ResizeObserver(measure);
    for (const child of Array.from(list.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [capped, count, visible]);

  return (
    <>
      <ul
        ref={ref}
        className={`relative ${capped ? "overflow-y-auto" : ""} ${className}`}
        style={
          capped
            ? { maxHeight: maxHeight ? `${maxHeight}px` : `${visible * 4}rem` }
            : undefined
        }
      >
        {children}
      </ul>
      {capped ? (
        <p className="border-t border-ink-200 bg-ink-50 px-4 py-1.5 text-xs text-ink-500">
          Showing {visible} of {count} — scroll for the rest
        </p>
      ) : null}
    </>
  );
}
