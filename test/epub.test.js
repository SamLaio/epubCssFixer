import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import JSZip from "jszip";
import { fixEpub, scanEpub } from "../src/epub.js";

async function writeSampleEpub(path) {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file("META-INF/container.xml", "<container/>");
  zip.file("OPS/style.css", ".a{text-spacing-trim:trim-start;color:black}");
  zip.file("OPS/ch1.xhtml", '<html><head><style>.b{text-combine:horizontal}</style></head><body><p style="duokan-text-indent:0;color:black">x</p><div style="font-family: &#34;; color: blue">y</div></body></html>');
  await writeFile(path, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

test("scan-epub and fix-epub handle CSS files, style blocks, and inline styles", async () => {
  const dir = await mkdtemp(join(tmpdir(), "epub-css-fixer-"));
  try {
    const input = join(dir, "input.epub");
    const output = join(dir, "output.epub");
    await writeSampleEpub(input);

    const before = await scanEpub(input);
    assert.equal(before.ok, false);
    assert.equal(before.totalIssues, 4);

    const fixed = await fixEpub(input, output);
    assert.equal(fixed.ok, true);
    assert.deepEqual(fixed.changedFiles.sort(), ["OPS/ch1.xhtml", "OPS/style.css"]);

    const zip = await JSZip.loadAsync(await readFile(output));
    assert.equal((await zip.file("OPS/style.css").async("string")).includes("text-spacing-trim"), false);
    const xhtml = await zip.file("OPS/ch1.xhtml").async("string");
    assert.equal(xhtml.includes("duokan-text-indent"), false);
    assert.equal(xhtml.includes("&#34"), false);
    assert.match(xhtml, /style="color: blue"/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
