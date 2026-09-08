/**
 * A small RFC 4180 CSV reader.
 *
 * Written by hand rather than pulled in as a dependency because the parsing
 * this app needs is narrow, and the failure mode of a sloppy split(",") is
 * silently mangled billing data. Asana's exports in particular put multi-line
 * quoted notes in the middle of rows, which a naive parser tears apart.
 */

/** Split raw CSV text into rows of cells. Handles quotes, escaped quotes,
 *  embedded newlines, CRLF, and a UTF-8 BOM. */
export function parseCSV(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];

  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let i = 0;

  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    // Skip rows that are entirely empty — trailing newlines are common.
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }

    if (ch === '"' && cell === "") {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      endCell();
      i += 1;
      continue;
    }
    if (ch === "\r") {
      if (text[i + 1] === "\n") i += 1;
      endRow();
      i += 1;
      continue;
    }
    if (ch === "\n") {
      endRow();
      i += 1;
      continue;
    }

    cell += ch;
    i += 1;
  }

  if (cell !== "" || row.length > 0) endRow();
  return rows;
}

export interface Sheet {
  headers: string[];
  rows: Record<string, string>[];
}

/** Parse into objects keyed by header. Duplicate headers get a numeric suffix. */
export function parseSheet(input: string): Sheet {
  const raw = parseCSV(input);
  if (raw.length === 0) return { headers: [], rows: [] };

  const seen = new Map<string, number>();
  const headers = raw[0].map((h) => {
    const name = h.trim();
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    return count === 0 ? name : `${name} (${count + 1})`;
  });

  const rows = raw.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? "").trim();
    });
    return record;
  });

  return { headers, rows };
}

const normalise = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Find the header that matches one of `aliases`, preferring earlier aliases.
 * Comparison ignores case, spaces and punctuation, so "Due Date", "due_date"
 * and "DueDate" all match the same alias — export formats vary between tools
 * and even between versions of the same tool.
 */
export function findHeader(
  headers: string[],
  aliases: string[],
): string | null {
  const normalisedHeaders = headers.map((h) => ({ raw: h, key: normalise(h) }));

  for (const alias of aliases) {
    const target = normalise(alias);
    const exact = normalisedHeaders.find((h) => h.key === target);
    if (exact) return exact.raw;
  }

  // Fall back to a containment match, which catches things like
  // "Time (hours)" for the alias "time".
  for (const alias of aliases) {
    const target = normalise(alias);
    const partial = normalisedHeaders.find(
      (h) => h.key.includes(target) && target.length >= 3,
    );
    if (partial) return partial.raw;
  }

  return null;
}

export const cell = (row: Record<string, string>, header: string | null) =>
  header ? (row[header] ?? "").trim() : "";
