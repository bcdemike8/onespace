/**
 * What may be attached to a deal, and what may be shown in the page.
 *
 * Pure: no database, no React. These are two different questions and the
 * difference matters. Accepting a file is a storage decision; rendering one
 * inside our own origin is a security decision, and the answer to the second
 * is much shorter than the answer to the first.
 */

/**
 * The cap on one file.
 *
 * An Outreach order form runs about half a megabyte; a signed SOW with
 * scanned pages runs to a few. 15MB takes those comfortably and refuses the
 * recording somebody will eventually try to attach — these live in Postgres
 * rows, and that is the right size for contracts and the wrong one for video.
 */
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

/**
 * Types the browser may render inside the page.
 *
 * Deliberately short. A file served from our own origin runs in our own
 * origin, so an uploaded .html or .svg could read the signed-in session of
 * whoever opened it. PDFs and raster images cannot, and they are what people
 * actually attach. Everything else downloads instead — which loses nothing,
 * because a .docx was never going to preview anyway.
 */
export const PREVIEWABLE = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
] as const;

export const canPreview = (mimeType: string): boolean =>
  (PREVIEWABLE as readonly string[]).includes(mimeType.toLowerCase().trim());

/**
 * Why this file can't be attached, or null.
 *
 * No type allow-list: an SOW arrives as a PDF, a Word file, a Pages export
 * or a zip, and refusing the ones nobody predicted would make this useless.
 * Safety is handled where it belongs — at serving time, by what is allowed
 * to render inline.
 */
export function fileProblem(name: string, size: number): string | null {
  if (name.trim() === "") return "That file has no name.";
  if (size <= 0) return "That file came through empty.";
  if (size > MAX_FILE_BYTES) {
    return `That file is ${formatSize(size)}. The limit is ${formatSize(MAX_FILE_BYTES)}.`;
  }
  return null;
}

/** "561 KB", "1.4 MB". What a person reads on a file row. */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

/**
 * A file name that is safe in a Content-Disposition header.
 *
 * A quote or a newline in the name would end the header early and let the
 * rest be read as another one. Names come straight off somebody's computer,
 * so this is not hypothetical.
 */
export function safeFilename(name: string): string {
  const clean = name.replace(/[\r\n"\\]/g, "").trim();
  return clean === "" ? "file" : clean.slice(0, 200);
}

/** A short word for the kind of file, for the row. */
export function kindOf(mimeType: string, name: string): string {
  const m = mimeType.toLowerCase();
  if (m === "application/pdf") return "PDF";
  if (m.startsWith("image/")) return "Image";
  if (m.includes("word") || name.toLowerCase().endsWith(".docx")) return "Word";
  if (m.includes("sheet") || name.toLowerCase().endsWith(".xlsx")) return "Spreadsheet";
  if (m.includes("presentation")) return "Slides";
  if (m.includes("zip")) return "Zip";
  const ext = name.includes(".") ? name.split(".").pop() : "";
  return ext ? ext.toUpperCase().slice(0, 5) : "File";
}
