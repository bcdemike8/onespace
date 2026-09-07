"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-xl font-semibold text-ink-900">Something broke.</h1>
      <p className="max-w-md text-sm text-ink-500">
        {error.message || "An unexpected error occurred."}
      </p>
      <button type="button" onClick={reset} className="btn-primary mt-2">
        Try again
      </button>
    </main>
  );
}
