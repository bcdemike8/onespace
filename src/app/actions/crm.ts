"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { STEP_ORDER, type Step, type StepReport } from "@/lib/crm/import";

export type CrmImportState = {
  error?: string;
  report?: StepReport;
};

const isStep = (v: unknown): v is Step =>
  typeof v === "string" && (STEP_ORDER as string[]).includes(v);

/**
 * Load one Salesforce object.
 *
 * One at a time, and admin-only: this writes thousands of rows and rewrites
 * the client list, which is not something to leave on a button anyone can
 * reach. Reading the CRM afterwards is open to everyone; loading it is not.
 */
export async function importSfdcAction(
  _prev: CrmImportState,
  formData: FormData,
): Promise<CrmImportState> {
  await requireAdmin();

  const step = formData.get("step");
  const csv = formData.get("csv");
  const recordTypes = formData.get("recordTypes");
  const unmatched = formData.get("unmatched");

  if (!isStep(step)) return { error: "Unknown import step." };
  if (typeof csv !== "string" || csv.trim() === "") {
    return { error: "Choose the CSV for this step first." };
  }

  const types = typeof recordTypes === "string" && recordTypes ? recordTypes : undefined;

  try {
    const lib = await import("@/lib/crm/import");
    // What to do about Salesforce users OneSpace has never heard of - people
    // who have left, mostly, who between them own several hundred deals.
    const policy: import("@/lib/crm/import").UnmatchedPeople =
      unmatched === "create"
        ? { kind: "create" }
        : typeof unmatched === "string" && unmatched && unmatched !== "none"
          ? { kind: "assign", userId: unmatched }
          : { kind: "none" };

    const report =
      step === "people"
        ? await lib.importPeople(csv, policy)
        : step === "accounts"
          ? await lib.importAccounts(csv, types)
          : step === "products"
            ? await lib.importProducts(csv)
            : step === "contacts"
              ? await lib.importContacts(csv)
              : step === "deals"
                ? await lib.importDeals(csv, types)
                : step === "lines"
                  ? await lib.importLines(csv)
                  : await lib.importContactRoles(csv);

    ["/clients", "/crm", "/projects"].forEach((p) => revalidatePath(p, "layout"));
    return { report };
  } catch (e) {
    // The real message, not a tidy one. An import that fails on row 400 of
    // 7,485 is only fixable if it says what row 400 had in it.
    return {
      error: e instanceof Error ? e.message : "The import failed.",
    };
  }
}
