#!/usr/bin/env node
// A form inside a form is invalid HTML, and it fails silently.
//
// The browser's parser throws the inner form away, so its fields join the
// outer one and its button submits the outer action. Nothing errors. The
// button just quietly does something else - which in this codebase meant
// "Reset password" saving a name, and "Not billable work" logging the time.
//
// React renders it happily, TypeScript has no opinion, and the tests that
// caught it were written after the bug shipped twice. So: a check.
//
//   node scripts/check-nested-forms.mjs

import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import { join, extname, basename } from "node:path";

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (extname(entry.name) === ".tsx") files.push(path);
  }
})("src");

const OPEN = /<form\b/g;
const CLOSE = /<\/form>/g;
const count = (line, re) => (line.match(re) ?? []).length;

// Components that render a <form> themselves: a whole file whose default
// export contains one, and named functions within a file.
const rendersForm = new Set();
const localForms = new Map();

for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (OPEN.test(text)) rendersForm.add(basename(file, ".tsx"));
  OPEN.lastIndex = 0;

  const locals = new Set();
  for (const m of text.matchAll(/function (\w+)\([^)]*\)\s*\{([\s\S]*?)\n\}/g)) {
    if (m[2].includes("<form")) locals.add(m[1]);
  }
  localForms.set(file, locals);
}

const problems = [];

for (const file of files) {
  const locals = localForms.get(file) ?? new Set();
  let depth = 0;

  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (depth > 0) {
        if (/<form\b/.test(line)) {
          problems.push(`${file}:${i + 1}  a <form> inside a <form>`);
        }
        for (const [, comp] of line.matchAll(/<([A-Z]\w*)\b/g)) {
          if (locals.has(comp) || (rendersForm.has(comp) && comp !== basename(file, ".tsx"))) {
            problems.push(`${file}:${i + 1}  <${comp}> renders a form, inside a form`);
          }
        }
      }
      depth = Math.max(0, depth + count(line, OPEN) - count(line, CLOSE));
    });
}

if (problems.length === 0) {
  console.log(`No nested forms. ${files.length} files checked.`);
  process.exit(0);
}

console.error("Nested forms - the inner one will be dropped by the browser:\n");
for (const p of problems) console.error("  " + p);
console.error(
  "\nMake them siblings. Where they have to share a row, `display: contents`" +
    "\non the outer form keeps the layout while separating the forms.",
);
process.exit(1);
