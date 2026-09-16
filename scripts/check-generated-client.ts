/**
 * Is the database client the one this schema describes?
 *
 * Prisma generates a typed client from schema.prisma into node_modules. A
 * `git pull` brings the schema and the code that uses it; it does not bring
 * the client, because the client isn't in the repository. `npm install`
 * regenerates it as a postinstall step, so most of the time nobody notices.
 * Pull a schema change without installing anything and you get this, twenty
 * times over:
 *
 *     Unknown argument `funders`. Available options are marked with ?.
 *
 * followed by the field list from the *old* schema - which is the answer,
 * but only if you already know to read it that way. It looks exactly like a
 * bug in the importer, and it cost an evening.
 *
 * So: before the first query, compare the models and fields in the schema
 * file against the ones the generated client actually knows about, and if
 * they have drifted say so in one sentence with the command that fixes it.
 *
 * Deliberately not `server-only`: the whole point is the command line.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Prisma } from "@prisma/client";

/**
 * Model name → field names, read straight from schema.prisma.
 *
 * A real parser would be better and is not worth it: the only thing needed
 * is the first word of each line inside a `model` block, and being wrong
 * here fails safe. An unrecognised line yields a field name the client also
 * doesn't have, which would be a false alarm - so only lines that look like
 * `name  Type` count, and attributes, comments and braces are skipped.
 */
export function modelsInSchema(source: string): Map<string, Set<string>> {
  const models = new Map<string, Set<string>>();
  let current: Set<string> | null = null;

  for (const line of source.split("\n")) {
    const trimmed = line.trim();

    if (current) {
      if (trimmed === "}") {
        current = null;
        continue;
      }
      if (trimmed === "" || trimmed.startsWith("//") || trimmed.startsWith("@@")) {
        continue;
      }
      const field = /^([A-Za-z_][A-Za-z0-9_]*)\s+[A-Za-z_[]/.exec(trimmed);
      if (field) current.add(field[1]);
      continue;
    }

    const model = /^model\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/.exec(trimmed);
    if (model) {
      current = new Set<string>();
      models.set(model[1], current);
    }
  }

  return models;
}

/** What the generated client knows, in the same shape. */
function modelsInClient(): Map<string, Set<string>> {
  const models = new Map<string, Set<string>>();
  for (const model of Prisma.dmmf.datamodel.models) {
    models.set(model.name, new Set(model.fields.map((f) => f.name)));
  }
  return models;
}

export type Drift = { model: string; fields: string[] };

/** Everything the schema has that the generated client has not. */
export function drift(
  schema: Map<string, Set<string>>,
  client: Map<string, Set<string>>,
): Drift[] {
  const out: Drift[] = [];
  for (const [model, fields] of schema) {
    const known = client.get(model);
    if (!known) {
      out.push({ model, fields: ["(the whole model)"] });
      continue;
    }
    const missing = [...fields].filter((f) => !known.has(f));
    if (missing.length > 0) out.push({ model, fields: missing });
  }
  return out;
}

/**
 * Stop, with an explanation, if the client is behind the schema.
 *
 * Called at the top of every script that touches the database, before any
 * work has been done - a half-finished import is worse than one that never
 * started.
 */
export function requireCurrentClient(root = process.cwd()): void {
  let source: string;
  try {
    source = readFileSync(join(root, "prisma", "schema.prisma"), "utf8");
  } catch {
    // No schema to compare against - not this check's business to complain.
    return;
  }

  const behind = drift(modelsInSchema(source), modelsInClient());
  if (behind.length === 0) return;

  const detail = behind
    .slice(0, 5)
    .map((d) => `  ${d.model}: ${d.fields.slice(0, 8).join(", ")}`)
    .join("\n");

  console.error(
    `\nThe database client in node_modules is older than prisma/schema.prisma.\n\n` +
      `It doesn't know about these yet:\n${detail}\n\n` +
      `Every write touching them would fail with "Unknown argument". Run:\n\n` +
      `  npx prisma generate\n\n` +
      `and then run this again. (A git pull brings the schema; only an install ` +
      `or that command rebuilds the client from it.)\n`,
  );
  process.exit(1);
}
