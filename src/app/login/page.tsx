import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { LoginForm, SetupForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  const needsSetup = (await db.user.count()) === 0;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold tracking-tight text-white">
            {BRAND.mark}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
            {BRAND.name}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {needsSetup
              ? "Create the first account to get started."
              : BRAND.tagline}
          </p>
        </div>

        <div className="card p-6">
          {needsSetup ? <SetupForm /> : <LoginForm />}
        </div>

        {needsSetup ? (
          <p className="mt-4 text-center text-xs text-ink-500">
            This account becomes the workspace administrator. Once it exists,
            this setup screen is replaced by the sign-in form.
          </p>
        ) : null}
      </div>
    </main>
  );
}
