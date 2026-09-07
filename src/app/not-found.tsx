import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-medium text-ink-500">404</p>
      <h1 className="text-xl font-semibold text-ink-900">
        That page isn&apos;t here.
      </h1>
      <Link href="/" className="btn-primary mt-2">
        Back to my work
      </Link>
    </main>
  );
}
