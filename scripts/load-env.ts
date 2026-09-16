/**
 * Read .env before anything asks for it.
 *
 * Next loads .env on its own and Prisma's CLI loads it too, which is exactly
 * why this was missed: everything in the app could see DATABASE_URL, so a
 * script run with tsx looked like it would as well. It doesn't. The Prisma
 * *client* reads process.env and nothing fills it in, so every query fails
 * with "Environment variable not found: DATABASE_URL" while a perfectly good
 * .env sits beside it.
 *
 * Imported first, before anything that builds a database client - module
 * evaluation is in import order, so first means first.
 *
 * Deliberately not a dependency. This is fifteen lines and the alternative
 * is another package to keep current.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const file = join(process.cwd(), ".env");

if (existsSync(file)) {
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    // Keys only - a leading # never matches, so comments fall through.
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;

    const [, key, rawValue] = match;
    // A value already in the environment wins: setting one on the command
    // line is how you point a script at somewhere other than the usual place.
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (quoted) value = value.slice(1, -1);

    process.env[key] = value;
  }
}

/** Say plainly what is missing, and where it comes from. */
export function requireDatabaseUrl(): void {
  if (process.env.DATABASE_URL) return;

  console.error(
    [
      "",
      "DATABASE_URL isn't set, so there's no database to talk to.",
      "",
      `Looked for it in ${file}`,
      existsSync(file)
        ? "  — that file exists but has no DATABASE_URL line in it."
        : "  — that file doesn't exist yet.",
      "",
      "Create it with one line, the same value the app uses in Railway",
      "(app service → Variables → DATABASE_URL):",
      "",
      '  DATABASE_URL="postgresql://…"',
      "",
      "Keep the quotes. Or pass it just for one run:",
      "",
      "  DATABASE_URL='postgresql://…' npm run crm:status",
      "",
    ].join("\n"),
  );
  process.exit(1);
}
