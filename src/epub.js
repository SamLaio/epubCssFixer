import { readFile, writeFile } from "node:fs/promises";
import JSZip from "jszip";
import { analyzeCss, analyzeDeclarationList, fixCss, fixDeclarationList } from "./css.js";

const CSS_FILE_RE = /\.css$/i;
const HTML_FILE_RE = /\.(xhtml|html|htm)$/i;

function escapeXmlAttribute(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function scanHtmlCss(text, file) {
  const issues = [];
  for (const match of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) {
    issues.push(...analyzeCss(match[1], { file }).issues);
  }
  for (const match of text.matchAll(/\sstyle=(["'])([\s\S]*?)\1/gi)) {
    issues.push(...analyzeDeclarationList(match[2], { file }));
  }
  return issues;
}

function fixHtmlCss(text) {
  let changed = false;
  let output = text.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_m, open, css, close) => {
    const fixed = fixCss(css).css;
    if (fixed !== css) changed = true;
    return `${open}${fixed}${close}`;
  });
  output = output.replace(/\sstyle=(["'])([\s\S]*?)\1/gi, (m, quote, style) => {
    const fixed = fixDeclarationList(style);
    if (fixed !== style) changed = true;
    return fixed ? ` style="${escapeXmlAttribute(fixed)}"` : "";
  });
  return { text: output, changed };
}

async function loadZip(path) {
  return JSZip.loadAsync(await readFile(path));
}

export async function scanEpub(path) {
  const zip = await loadZip(path);
  const issues = [];
  for (const [name, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    if (CSS_FILE_RE.test(name)) {
      issues.push(...analyzeCss(await entry.async("string"), { file: name }).issues);
    } else if (HTML_FILE_RE.test(name)) {
      issues.push(...scanHtmlCss(await entry.async("string"), name));
    }
  }
  return { ok: issues.length === 0, file: path, totalIssues: issues.length, issues };
}

export async function fixEpub(input, output) {
  const source = await loadZip(input);
  const target = new JSZip();
  const changes = [];

  for (const [name, entry] of Object.entries(source.files)) {
    if (entry.dir) {
      target.folder(name);
      continue;
    }
    let data = await entry.async("nodebuffer");
    if (CSS_FILE_RE.test(name)) {
      const original = data.toString("utf8");
      const fixed = fixCss(original, { file: name }).css;
      if (fixed !== original) {
        data = Buffer.from(fixed, "utf8");
        changes.push(name);
      }
    } else if (HTML_FILE_RE.test(name)) {
      const original = data.toString("utf8");
      const fixed = fixHtmlCss(original);
      if (fixed.changed) {
        data = Buffer.from(fixed.text, "utf8");
        changes.push(name);
      }
    }
    target.file(name, data, {
      date: entry.date,
      compression: name === "mimetype" ? "STORE" : "DEFLATE",
    });
  }

  const buffer = await target.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await writeFile(output, buffer);
  const scan = await scanEpub(output);
  return { ...scan, input, output, changedFiles: changes };
}
