import { readFile, writeFile } from "node:fs/promises";
import JSZip from "jszip";
import { analyzeCss, analyzeDeclarationList, fixCss, fixDeclarationList } from "./css.js";

const CSS_FILE_RE = /\.css$/i;
const HTML_FILE_RE = /\.(xhtml|html|htm)$/i;

// XHTML 的 style 是 XML 文字；HTML raw-text 與 CDATA 不解碼實體。
function styleText(css, text, file) {
  const xml = /\.xhtml$/i.test(file) || /<html\b[^>]*\bxmlns=["']http:\/\/www\.w3\.org\/1999\/xhtml["']/i.test(text);
  const cdata = xml && /^\s*<!\[CDATA\[([\s\S]*)\]\]>\s*$/.exec(css);
  if (cdata) return { css: cdata[1], xml: false, cdata: true };
  if (!xml || css.includes("<![CDATA[")) return { css, xml: false };
  const entities = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
  return { xml: true, css: css.replace(/&(lt|gt|amp|quot|apos|#\d+|#x[\da-f]+);/gi, (raw, entity) => {
    if (!entity.startsWith("#")) return entities[entity] ?? raw;
    const code = entity[1].toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : raw;
  }) };
}

function escapeXmlAttribute(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function scanHtmlCss(text, file) {
  const issues = [];
  for (const match of text.matchAll(/<style\b(?![^>]*\/\s*>)[^>]*>([\s\S]*?)<\/style>/gi)) {
    issues.push(...analyzeCss(styleText(match[1], text, file).css, { file }).issues);
  }
  for (const match of text.matchAll(/\sstyle=(["'])([\s\S]*?)\1/gi)) {
    issues.push(...analyzeDeclarationList(match[2], { file }));
  }
  return issues;
}

function fixHtmlCss(text, file) {
  let changed = false;
  let output = text.replace(/(<style\b(?![^>]*\/\s*>)[^>]*>)([\s\S]*?)(<\/style>)/gi, (_m, open, css, close) => {
    const decoded = styleText(css, text, file);
    let fixed = fixCss(decoded.css).css;
    if (decoded.xml) fixed = fixed.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    if (decoded.cdata) fixed = `<![CDATA[${fixed}]]>`;
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
  let beforeIssues = 0;

  for (const [name, entry] of Object.entries(source.files)) {
    if (entry.dir) {
      target.folder(name);
      continue;
    }
    let data = await entry.async("nodebuffer");
    if (CSS_FILE_RE.test(name)) {
      const original = data.toString("utf8");
      const result = fixCss(original, { file: name });
      beforeIssues += result.issues.length + result.fixedIssues;
      const fixed = result.css;
      if (fixed !== original) {
        data = Buffer.from(fixed, "utf8");
        changes.push(name);
      }
    } else if (HTML_FILE_RE.test(name)) {
      const original = data.toString("utf8");
      beforeIssues += scanHtmlCss(original, name).length;
      const fixed = fixHtmlCss(original, name);
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
  return { ...scan, input, output, changedFiles: changes, changed: changes.length > 0, fixedIssues: Math.max(0, beforeIssues - scan.totalIssues) };
}
