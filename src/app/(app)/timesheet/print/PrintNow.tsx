"use client";

import { useEffect } from "react";

/**
 * Opens the browser's print dialog as soon as the page is ready.
 *
 * "Save as PDF" is a destination in that dialog in every current browser, so
 * this is the whole of the PDF export — no library, no headless Chromium on
 * the Railway image, and the output is a real PDF the browser rendered from
 * the same markup you can see.
 *
 * Fires once. A re-render must not reopen a dialog somebody just cancelled.
 */
export function PrintNow({ filename }: { filename: string }) {
  useEffect(() => {
    // Browsers name the PDF after the document title, so this is what lands
    // in Downloads. Restored afterwards so the tab doesn't keep the filename
    // as its title.
    const previous = document.title;
    document.title = filename;

    const id = setTimeout(() => window.print(), 400);
    return () => {
      clearTimeout(id);
      document.title = previous;
    };
  }, [filename]);

  return null;
}

/** Reopens the dialog after somebody cancels it. */
export function PrintAgain() {
  return (
    <button type="button" className="btn-secondary btn-sm" onClick={() => window.print()}>
      Open it again
    </button>
  );
}
