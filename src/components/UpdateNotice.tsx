"use client";

import { useEffect, useState } from "react";

/**
 * Tell people when the page they're looking at is from an older deploy.
 *
 * Next.js gives every server action an id derived from the build, and a
 * button pressed on a page from the previous build sends an id the new
 * server has never heard of. What the person sees is "Something broke.
 * Server Action ... was not found on the server", which reads like the app
 * falling over rather than like a page that needs reloading - and during a
 * day of frequent deploys it happens over and over.
 *
 * So: ask which copy of the app is answering, and say so when it changes.
 * Not an automatic reload - a form half filled in is worth more than the
 * few seconds it saves.
 */
export function UpdateNotice() {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let mine: string | null = null;
    let stopped = false;

    const check = async () => {
      // No point asking while nobody is looking, and it keeps a background
      // tab from polling all night.
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { id } = (await res.json()) as { id?: string };
        if (!id || stopped) return;
        if (mine === null) mine = id;
        else if (id !== mine) setStale(true);
      } catch {
        // Offline, or the app is mid-deploy. Neither is worth saying
        // anything about; the next check will settle it.
      }
    };

    void check();
    const timer = setInterval(check, 120_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  if (!stale) return null;

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-brand-600 px-4 py-2 text-center text-xs text-white">
      <span>OneSpace was updated. Reload before using the buttons on this page.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-white/20 px-2 py-0.5 font-medium hover:bg-white/30"
      >
        Reload
      </button>
    </div>
  );
}
