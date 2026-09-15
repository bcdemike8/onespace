import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ImportSfdc } from "./ImportSfdc";

export const dynamic = "force-dynamic";

/**
 * Salesforce, loaded one object at a time.
 *
 * Deliberately not one button. A single request carrying 1,037 accounts,
 * 7,485 contacts and 1,269 deals is the exact shape of request that gets cut
 * off halfway by something in between, and a half-finished import is worse
 * than none at all. Each step here is small enough to finish and safe to run
 * again.
 */
export default async function CrmImportPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Import from Salesforce"
        subtitle="One object at a time, in order, as many times as you like."
      />

      <div className="card mb-4 p-4">
        <p className="text-sm leading-relaxed text-ink-700">
          Every record keeps its Salesforce id, so running a step again{" "}
          <strong className="font-medium">updates what&apos;s there rather than
          duplicating it</strong>. If a mapping turns out wrong, fix it and load
          the same file again — there is nothing to clean up first.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          Work down the list. Each step says what it needs loaded before it.
        </p>
      </div>

      <ImportSfdc />

      <p className="mt-4 text-xs leading-relaxed text-ink-500">
        Afterwards: <Link href="/clients" className="underline">Clients</Link>{" "}
        holds the accounts, and anything the import couldn&apos;t place is named
        in the report rather than counted — an account two companies share a
        name with, a contact whose account hasn&apos;t been loaded yet.
      </p>
    </div>
  );
}
