import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import JSZip from 'jszip';
import { fixEpub, scanEpub } from '../src/epub.js';

test('只掃描真正的style屬性，保留跳脫HTML文字、註解、CDATA與其他屬性中的範例', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'epub-inline-text-'));
  try {
    const input = join(dir, 'input.epub'), output = join(dir, 'output.epub');
    const original = `<html xmlns="http://www.w3.org/1999/xhtml"><body>
<p>&lt;fieldset style="width:170px;height:70px;border:#1E90FF outset 2px;"&gt;作者原文</p>
<p>&lt;p style="duokan-text-indent:0;"&gt;範例</p>
<!-- <p style="duokan-text-indent:0;">註解</p> -->
<pre><![CDATA[<p style="duokan-text-indent:0;">範例</p>]]></pre>
<p data-example=' style="duokan-text-indent:0;"'>其他屬性值不可改動</p>
</body></html>`;
    const zip = new JSZip(); zip.file('chapter.xhtml', original);
    await writeFile(input, await zip.generateAsync({ type: 'nodebuffer' }));
    assert.equal((await scanEpub(input)).totalIssues, 0);
    assert.equal((await fixEpub(input, output)).changed, false);
    const result = await JSZip.loadAsync(await readFile(output));
    assert.equal(await result.file('chapter.xhtml').async('string'), original);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('真實屬性仍可修復，前一個屬性值含大於符號或相反引號不會截斷標籤', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'epub-inline-attribute-'));
  try {
    const input = join(dir, 'input.epub'), output = join(dir, 'output.epub');
    const zip = new JSZip();
    zip.file('chapter.xhtml', `<html><body><p data-note="a > b" data-example=' style="color:red"' style="duokan-text-indent:0;color:blue">正文</p></body></html>`);
    await writeFile(input, await zip.generateAsync({ type: 'nodebuffer' }));
    assert.equal((await scanEpub(input)).totalIssues, 1);
    assert.equal((await fixEpub(input, output)).ok, true);
    const result = await JSZip.loadAsync(await readFile(output));
    const text = await result.file('chapter.xhtml').async('string');
    assert.match(text, /data-note="a > b"/);
    assert.match(text, /data-example=' style="color:red"'/);
    assert.doesNotMatch(text, /duokan-text-indent/);
    assert.match(text, /style="color:\s*blue"/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
