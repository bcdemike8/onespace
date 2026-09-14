"use client";

/**
 * A page that fell over.
 *
 * One cause gets its own answer: a page loaded before a deploy, pressing a
 * button the new server doesn't recognise. "Try again" can't fix that - the
 * stale code is the page you're standing on - so it would fail again, which
 * is how one deploy turns into five minutes of a screen that looks broken.
 */
function isStale(error: Error & { digest?: string }): boolean {
  const message = `${error.message} ${error.digest ?? ""}`.toLowerCase();
  return (
    message.includes("server action") &&
    (message.includes("not found") || message.includes("failed to find"))
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const stale = isStale(error);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold text-ink-900">
        {stale ? "This page is out of date." : "Something broke."}
      </h1>
      <p className="max-w-md text-sm text-ink-500">
        {stale
          ? "OneSpace was updated while this page was open, so the button you pressed belonged to the old version. Reloading picks up the new one — nothing is wrong with your data."
          : error.message || "An unexpected error occurred."}
      </p>
      {stale ? (
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-primary mt-2"
        >
          Reload the page
        </button>
      ) : (
        <button type="button" onClick={reset} className="btn-primary mt-2">
          Try again
        </button>
      )}
    </main>
  );
}
