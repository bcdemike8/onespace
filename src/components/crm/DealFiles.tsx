"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteDealFileAction,
  uploadDealFileAction,
} from "@/app/actions/crm-files";
import { MAX_FILE_BYTES, canPreview, formatSize, kindOf } from "@/lib/crm/files";
import { SubmitButton } from "@/components/SubmitButton";
import { ErrorNote } from "@/components/ui";

export interface DealFileRow {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedBy: string | null;
  uploadedAt: string;
}

/**
 * The signed SOW, the order form, the quote — on the deal they belong to.
 *
 * Click one and it opens over the page rather than navigating away, because
 * the reason you open an order form is to read a number off it and then
 * carry on with what you were doing. A PDF goes in an iframe and the
 * browser's own viewer does the scrolling, which is better than anything
 * worth building: search, zoom, page numbers, print, all free.
 */
/** /api/crm/files/<id>/<name> — the name is only there so a PDF viewer can
 *  title its window with something a person recognises. */
const urlFor = (file: DealFileRow, download = false) =>
  `/api/crm/files/${file.id}/${encodeURIComponent(file.name)}${download ? "?download=1" : ""}`;

export function DealFiles({
  dealId,
  files,
}: {
  dealId: string;
  files: DealFileRow[];
}) {
  const [state, upload] = useActionState(uploadDealFileAction, {});
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<DealFileRow | null>(null);

  useEffect(() => {
    if (state.ok) form.current?.reset();
  }, [state]);

  return (
    <section className="card p-4">
      <h2 className="mb-1 text-sm font-medium text-ink-900">
        Files <span className="text-ink-400">({files.length})</span>
      </h2>

      {files.length === 0 ? (
        <p className="text-sm text-ink-400">None.</p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {files.map((file) => (
            <Row key={file.id} file={file} onOpen={() => setOpen(file)} />
          ))}
        </ul>
      )}

      <form ref={form} action={upload} className="mt-3 border-t border-ink-100 pt-3">
        <input type="hidden" name="dealId" value={dealId} />
        <input
          ref={input}
          type="file"
          name="file"
          required
          className="block w-full text-xs text-ink-600 file:mr-2 file:rounded-md file:border file:border-ink-300 file:bg-white file:px-2 file:py-1 file:text-xs file:font-medium file:text-ink-700 hover:file:bg-ink-50"
        />
        <div className="mt-2 flex items-center gap-2">
          <SubmitButton pendingLabel="Uploading…" className="btn-secondary btn-sm">
            Upload
          </SubmitButton>
          <span className="text-xs text-ink-400">
            Up to {formatSize(MAX_FILE_BYTES)}
          </span>
        </div>
        <ErrorNote message={state.error} />
      </form>

      {open ? <Preview file={open} onClose={() => setOpen(null)} /> : null}
    </section>
  );
}

function Row({ file, onOpen }: { file: DealFileRow; onOpen: () => void }) {
  const [, start] = useTransition();
  const router = useRouter();
  const viewable = canPreview(file.mimeType);

  return (
    <li className="flex items-baseline gap-2 py-2 text-sm">
      <span className="min-w-0 flex-1">
        {viewable ? (
          <button
            type="button"
            onClick={onOpen}
            className="block max-w-full truncate text-left text-ink-900 underline"
          >
            {file.name}
          </button>
        ) : (
          <a
            href={urlFor(file, true)}
            className="block max-w-full truncate text-ink-900 underline"
          >
            {file.name}
          </a>
        )}
        <span className="block text-xs text-ink-500">
          {kindOf(file.mimeType, file.name)} · {formatSize(file.size)} ·{" "}
          {file.uploadedAt}
          {file.uploadedBy ? ` · ${file.uploadedBy}` : ""}
        </span>
      </span>

      <a
        href={urlFor(file, true)}
        className="shrink-0 text-xs text-ink-500 underline"
      >
        Download
      </a>
      <button
        type="button"
        className="shrink-0 text-xs text-ink-400 underline hover:text-bad-700"
        onClick={() => {
          if (!confirm(`Remove ${file.name} from this deal?`)) return;
          const body = new FormData();
          body.set("id", file.id);
          void deleteDealFileAction(body).then(() => start(() => router.refresh()));
        }}
      >
        Remove
      </button>
    </li>
  );
}

/**
 * The file, over the page.
 *
 * A <dialog> rather than a div: the browser handles Escape, the backdrop and
 * taking focus out of the page behind, and gets all of that right on a
 * phone too.
 */
function Preview({ file, onClose }: { file: DealFileRow; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const isImage = file.mimeType.toLowerCase().startsWith("image/");

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className="m-auto h-[90vh] w-[min(1100px,95vw)] rounded-xl p-0 backdrop:bg-ink-900/50"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-3 border-b border-ink-200 px-4 py-2.5">
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">
            {file.name}
          </span>
          <span className="shrink-0 text-xs text-ink-500">
            {formatSize(file.size)}
          </span>
          <a
            href={urlFor(file, true)}
            className="shrink-0 text-xs text-brand-700 underline"
          >
            Download
          </a>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className="btn-ghost btn-sm shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-ink-100">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urlFor(file)}
              alt={file.name}
              className="mx-auto block max-w-full"
            />
          ) : (
            <iframe
              src={urlFor(file)}
              title={file.name}
              className="h-full w-full border-0"
            />
          )}
        </div>
      </div>
    </dialog>
  );
}
