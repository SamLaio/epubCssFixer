#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { analyzeCss, fixCss } from "../src/css.js";
import { fixEpub, scanEpub } from "../src/epub.js";

const VERSION = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")).version;

function usage(exitCode = 0) {
  const text = `epubCssFixer ${VERSION}

Usage:
  epub-css-fixer check input.css [--json]
  epub-css-fixer fix input.css -o output.css [--json]
  epub-css-fixer scan-epub input.epub [--json]
  epub-css-fixer fix-epub input.epub -o output.epub [--json]
  epub-css-fixer --version
`;
  (exitCode ? console.error : console.log)(text);
  process.exit(exitCode);
}

function optionValue(args, name) {
  const i = args.indexOf(name);
  if (i === -1) return null;
  return args[i + 1] || null;
}

function printResult(result, json) {
  if (!result.ok) process.exitCode = 2;
  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const count = result.issues?.length ?? result.totalIssues ?? 0;
  console.log(`${result.ok ? "OK" : "ISSUES"} ${count} issue(s)`);
  for (const issue of result.issues || []) {
    const loc = issue.line ? `${issue.file || result.file}:${issue.line}:${issue.column || 1}` : issue.file || result.file;
    console.log(`- ${loc}: ${issue.type} ${issue.property || ""} ${issue.message || ""}`.trim());
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes("-h") || args.includes("--help")) usage();
  if (args[0] === "--version" || args[0] === "version") {
    console.log(VERSION);
    return;
  }

  const command = args[0];
  const input = args[1];
  const json = args.includes("--json");
  if (!input) usage(1);

  if (command === "check") {
    const css = await readFile(input, "utf8");
    printResult(analyzeCss(css, { file: input }), json);
    return;
  }

  if (command === "fix") {
    const output = optionValue(args, "-o") || optionValue(args, "--output");
    if (!output) usage(1);
    const css = await readFile(input, "utf8");
    const result = fixCss(css, { file: input });
    await writeFile(output, result.css, "utf8");
    printResult({ ...result, file: input, output }, json);
    return;
  }

  if (command === "scan-epub") {
    printResult(await scanEpub(input), json);
    return;
  }

  if (command === "fix-epub") {
    const output = optionValue(args, "-o") || optionValue(args, "--output");
    if (!output) usage(1);
    if (basename(input) === basename(output) && input === output) {
      throw new Error("輸入與輸出 EPUB 不可為同一路徑");
    }
    printResult(await fixEpub(input, output), json);
    return;
  }

  usage(1);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
