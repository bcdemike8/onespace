import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_FILE_BYTES,
  canPreview,
  fileProblem,
  formatSize,
  kindOf,
  safeFilename,
} from "@/lib/crm/files";

test("a real order form is accepted", () => {
  // The one in Brianna's screenshot: 561KB, signed, ten pages.
  assert.equal(fileProblem("Order Form (LuxGive, LLC and Outreach Corp).pdf", 561_000), null);
});

test("nothing is refused for its type — an SOW arrives in every format there is", () => {
  for (const name of ["SOW.docx", "SOW.pages", "quote.zip", "notes.txt", "scan.tiff"]) {
    assert.equal(fileProblem(name, 100_000), null, name);
  }
});

test("empty, nameless and enormous are refused, and say so in units people read", () => {
  assert.match(fileProblem("x.pdf", 0) ?? "", /empty/);
  assert.match(fileProblem("   ", 100) ?? "", /no name/);
  assert.match(fileProblem("big.mp4", 80 * 1024 * 1024) ?? "", /80 MB.*limit is 15 MB/);
  assert.equal(fileProblem("just.pdf", MAX_FILE_BYTES), null);
  assert.notEqual(fileProblem("one.pdf", MAX_FILE_BYTES + 1), null);
});

test("only PDFs and raster images may render inside the page", () => {
  // A file served from our origin runs in our origin. An uploaded .html or
  // .svg could read the session of whoever opened it.
  assert.equal(canPreview("application/pdf"), true);
  assert.equal(canPreview("image/png"), true);
  assert.equal(canPreview("IMAGE/JPEG"), true);

  for (const dangerous of [
    "text/html",
    "image/svg+xml",
    "application/xhtml+xml",
    "text/xml",
    "application/javascript",
  ]) {
    assert.equal(canPreview(dangerous), false, dangerous);
  }
  assert.equal(canPreview("application/vnd.openxmlformats-officedocument.wordprocessingml.document"), false);
});

test("sizes read the way a person would say them", () => {
  assert.equal(formatSize(400), "400 B");
  assert.equal(formatSize(561_000), "548 KB");
  assert.equal(formatSize(1_500_000), "1.4 MB");
  assert.equal(formatSize(15 * 1024 * 1024), "15 MB");
});

test("a file name cannot break out of the header it is put in", () => {
  // Names come straight off somebody's computer. A quote would end the
  // Content-Disposition header early and let the rest be read as another.
  assert.equal(safeFilename('in"jected.pdf'), "injected.pdf");
  assert.equal(safeFilename("two\r\nlines.pdf"), "twolines.pdf");
  assert.equal(safeFilename("   "), "file");
  assert.equal(safeFilename("a".repeat(500)).length, 200);
  assert.equal(safeFilename("Order Form (LuxGive).pdf"), "Order Form (LuxGive).pdf");
});

test("the kind is a word somebody recognises", () => {
  assert.equal(kindOf("application/pdf", "sow.pdf"), "PDF");
  assert.equal(kindOf("image/png", "shot.png"), "Image");
  assert.equal(
    kindOf("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "sow.docx"),
    "Word",
  );
  assert.equal(kindOf("application/octet-stream", "archive.rar"), "RAR");
  assert.equal(kindOf("application/octet-stream", "noextension"), "File");
});
