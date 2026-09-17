"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MAX_FILE_BYTES, fileProblem, safeFilename } from "@/lib/crm/files";

export type FileState = { error?: string; ok?: boolean };

/**
 * Attach a file to a deal.
 *
 * The bytes go into DealFileBody in the same transaction as the row, so a
 * failure halfway cannot leave a file that exists in the list and 404s when
 * somebody opens it.
 */
export async function uploadDealFileAction(
  _prev: FileState,
  formData: FormData,
): Promise<FileState> {
  const user = await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  const file = formData.get("file");

  if (!(file instanceof File)) return { error: "Pick a file first." };

  // Cheap refusal before reading anything into memory.
  if (file.size > MAX_FILE_BYTES) {
    return { error: fileProblem(file.name, file.size) ?? "That file is too big." };
  }

  const deal = await db.deal.findUnique({ where: { id: dealId }, select: { id: true } });
  if (!deal) return { error: "That deal no longer exists." };

  const bytes = Buffer.from(await file.arrayBuffer());
  const problem = fileProblem(file.name, bytes.byteLength);
  if (problem) return { error: problem };

  await db.dealFile.create({
    data: {
      dealId: deal.id,
      name: safeFilename(file.name),
      // What the browser said it is. Never trusted for rendering — the
      // serving route decides that from its own allow-list.
      mimeType: file.type || "application/octet-stream",
      size: bytes.byteLength,
      uploadedById: user.id,
      body: { create: { data: bytes } },
    },
  });

  revalidatePath(`/crm/deals/${deal.id}`);
  return { ok: true };
}

export async function deleteDealFileAction(formData: FormData): Promise<void> {
  await requireUser();
  const id = String(formData.get("id") ?? "");

  const file = await db.dealFile.findUnique({
    where: { id },
    select: { dealId: true },
  });
  if (!file) return;

  // The body goes with it, by the cascade on DealFileBody.
  await db.dealFile.delete({ where: { id } });
  revalidatePath(`/crm/deals/${file.dealId}`);
}
