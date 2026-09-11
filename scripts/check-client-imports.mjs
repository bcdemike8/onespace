#!/usr/bin/env node
// Server code calling a plain function out of a "use client" module.
//
// The bundler replaces every export of a client module with a reference
// proxy. Importing a *component* is fine - the server renders it as a
// client boundary. Importing a plain function and calling it is not: you
// get the proxy, and calling it throws
//
//   Attempted to call asSummaryDoc() from the server but asSummaryDoc is
//   on the client.
//
// TypeScript is happy, the build is clean, and it only fails at render -
// and only when there is data to render, which is why this one reached
// production and sat there until a page had a summary on it.
//
//   node scripts/check-client-imports.mjs

import { readFileSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if ([".ts", ".tsx"].includes(extname(e.name))) files.push(p);
  }
})("src");

const isClient = (text) => /^\s*["']use client["']/m.test(text.split("\n").slice(0, 5).join("\n"));

// Every non-component export of every client module, by import path.
const clientExports = new Map();

for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (!isClient(text)) continue;

  const names = new Set();
  for (const m of text.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)) names.add(m[1]);
  for (const m of text.matchAll(/export\s+const\s+(\w+)/g)) names.add(m[1]);

  // A PascalCase export is a component: rendering one from the server is
  // the entire point of a client module, and always fine.
  const plain = [...names].filter((n) => !/^[A-Z]/.test(n));
  if (plain.length === 0) continue;

  const alias = "@/" + file.replace(/^src\//, "").replace(/\.tsx?$/, "");
  clientExports.set(alias, { file, plain: new Set(plain) });
}

const problems = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (isClient(text)) continue; // client importing client is fine

  for (const m of text.matchAll(/import\s+(type\s+)?\{([^}]+)\}\s+from\s+["']([^"']+)["']/g)) {
    const [, typeOnly, names, from] = m;
    if (typeOnly) continue; // types are erased; never a runtime reference
    const target = clientExports.get(from);
    if (!target) continue;

    for (const raw of names.split(",")) {
      const name = raw.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim();
      if (raw.includes("type ")) continue;
      if (target.plain.has(name)) {
        problems.push(
          `${file}  imports ${name}() from ${target.file}, which is a client module`,
        );
      }
    }
  }
}

if (problems.length === 0) {
  console.log(`No server code calling into client modules. ${files.length} files checked.`);
  process.exit(0);
}

console.error("Server code importing a plain function from a client module:\n");
for (const p of problems) console.error("  " + p);
console.error(
  "\nMove the function to a plain module under src/lib and import it from" +
    "\nthere on both sides. Components are fine; only plain functions break.",
);
process.exit(1);
