import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import JSZip from 'jszip';
import { scanEpub, fixEpub } from '../src/epub.js';

test('檢查無副檔名且明確宣告UTF-8的CSS；未知與二進位資料保留', async () => {
  const dir=await mkdtemp(join(tmpdir(),'extensionless-css-'));
  try {
    const input=join(dir,'input.epub'), output=join(dir,'output.epub');
    const zip=new JSZip();
    zip.file('mimetype','application/epub+zip');
    zip.file('OPS/style_inside','@charset "UTF-8";p{margin:1em;margin:0.2;color:red}');
    const untouched={'OPS/unknown':'p{margin:0.2}', 'OPS/binary':Buffer.from('@charset "UTF-8";p{margin:0.2}\0'), 'OPS/data.bin':'@charset "UTF-8";p{margin:0.2}'};
    for (const [name,data] of Object.entries(untouched)) zip.file(name,data);
    await writeFile(input,await zip.generateAsync({type:'nodebuffer'}));
    const scan=await scanEpub(input);
    assert.equal(scan.totalIssues,1);
    assert.equal(scan.issues[0].file,'OPS/style_inside');
    const fixed=await fixEpub(input,output);
    assert.equal(fixed.ok,true);assert.equal(fixed.totalIssues,0);assert.equal(fixed.fixedIssues,1);
    assert.deepEqual(fixed.changedFiles,['OPS/style_inside']);
    const result=await JSZip.loadAsync(await readFile(output));
    const css=await result.file('OPS/style_inside').async('string');
    assert.match(css,/margin:1em/);assert.doesNotMatch(css,/margin:0\.2/);
    for (const name of Object.keys(untouched)) assert.deepEqual(await result.file(name).async('nodebuffer'),await zip.file(name).async('nodebuffer'));
    assert.equal((await scanEpub(output)).totalIssues,0);
  } finally { await rm(dir,{recursive:true,force:true}); }
});
