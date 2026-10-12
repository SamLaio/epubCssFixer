import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import JSZip from "jszip";
import { fixEpub, scanEpub } from "../src/epub.js";

test("XHTML style 實體先解碼再驗證，輸出仍為合法 XML；HTML raw-text 不解碼", async () => {
  const dir = await mkdtemp(join(tmpdir(), "epub-css-xml-entities-"));
  try {
    const input = join(dir, "input.epub"), output = join(dir, "output.epub");
    const zip = new JSZip();
    zip.file("raw.html", '<html><style>p::before{content:"&amp;"}</style></html>');
    zip.file("cdata.xhtml", '<html><style><![CDATA[div>p{color:blue}]]></style></html>');
    zip.file("chapter.xhtml", '<html xmlns="http://www.w3.org/1999/xhtml"><head><style>div.main&gt;p{text-align:justify} p::before{content:&quot;A&amp;B&lt;C&quot;}</style></head><body>正文</body></html>');
    await writeFile(input, await zip.generateAsync({ type: "nodebuffer" }));
    assert.equal((await scanEpub(input)).ok, true);
    assert.equal((await fixEpub(input, output)).ok, true);
    const result = await JSZip.loadAsync(await readFile(output));
    assert.match(await result.file("chapter.xhtml").async("string"), /div\.main&gt;p/);
    assert.match(await result.file("chapter.xhtml").async("string"), /A&amp;B&lt;C/);
    assert.match(await result.file("raw.html").async("string"), /content:"&amp;"/);
    assert.match(await result.file("cdata.xhtml").async("string"), /<!\[CDATA\[div>p/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("空的自閉 style 不會吞入下一個樣式區塊", async () => {
  const dir = await mkdtemp(join(tmpdir(), "epub-css-self-closing-"));
  try {
    const input = join(dir, "input.epub"), output = join(dir, "output.epub");
    const zip = new JSZip();
    zip.file("chapter.xhtml", '<html><head><style id="koboSpanStyle"/><style type="text/css">p{color:blue}</style></head><body>正文</body></html>');
    await writeFile(input, await zip.generateAsync({ type: "nodebuffer" }));
    assert.equal((await scanEpub(input)).totalIssues, 0);
    assert.equal((await fixEpub(input, output)).ok, true);
    const result = await JSZip.loadAsync(await readFile(output));
    const text = await result.file("chapter.xhtml").async("string");
    assert.match(text, /<style id="koboSpanStyle"\/>/);
    assert.match(text, /p\{color:blue\}/);
    assert.match(text, /正文/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

async function writeSampleEpub(path) {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
  zip.file("META-INF/container.xml", "<container/>");
  zip.file("OPS/style.css", ".a{text-spacing-trim:trim-start;color:black}/* [InDesign專用：預設框架] */.def-div{margin:0}.def-paragraph{padding:0}/* 一般 */.keep{color:blue}");
  zip.file("OPS/ch1.xhtml", '<html><head><style>.b{text-combine:horizontal}/* [InDesign專用：註腳編號] */._idFootnoteLink{font-size:0.6rem}</style></head><body><p style="duokan-text-indent:0;color:black">x</p><div style="font-family: &#34;; color: blue">y</div></body></html>');
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
    const checked = spawnSync(process.execPath, ["bin/epub-css-fixer.js", "scan-epub", input, "--json"], { cwd: new URL("..", import.meta.url), encoding: "utf8" });
    assert.equal(checked.status, 2);
    assert.equal(JSON.parse(checked.stdout).ok, false);

    const fixed = await fixEpub(input, output);
    assert.equal(fixed.ok, true);
    assert.equal(fixed.changed, true);
    assert.equal(fixed.fixedIssues, 4);
    assert.deepEqual(fixed.changedFiles.sort(), ["OPS/ch1.xhtml", "OPS/style.css"]);

    const zip = await JSZip.loadAsync(await readFile(output));
    const css = await zip.file("OPS/style.css").async("string");
    assert.equal(css.includes("text-spacing-trim"), false);
    assert.doesNotMatch(css, /\.def-div|\.def-paragraph/);
    assert.match(css, /\.keep/);
    const xhtml = await zip.file("OPS/ch1.xhtml").async("string");
    assert.equal(xhtml.includes("duokan-text-indent"), false);
    assert.equal(xhtml.includes("&#34"), false);
    assert.doesNotMatch(xhtml, /\._idFootnoteLink/);
    assert.match(xhtml, /style="color: blue"/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
