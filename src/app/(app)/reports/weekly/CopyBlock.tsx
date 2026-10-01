"use client";

import { useEffect, useState } from "react";

/**
 * One rendered update, with the button that gets it into RocketLane.
 *
 * The text is shown in full rather than behind a "copy" button alone: the
 * whole point is that somebody reads it before it goes to a customer, and a
 * button that copies something you haven't seen is how a placeholder ends up
 * in a client's inbox.
 */
export function CopyBlock({
  text,
  label = "Copy",
  className = "btn-secondary btn-sm",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(false), 2000);
    return () => clearTimeout(t);
  }, [done]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
    } catch {
      // Clipboard access can be refused outright — an insecure origin, a
      // locked-down browser. Selecting the text below still works, so say
      // that rather than failing silently.
      setDone(false);
      alert("Your browser wouldn't allow the copy. Select the text below instead.");
    }
  };

  return (
    <button type="button" onClick={copy} className={className} aria-live="polite">
      {done ? "Copied" : label}
    </button>
  );
}
