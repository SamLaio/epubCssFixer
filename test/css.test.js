import assert from "node:assert/strict";
import test from "node:test";
import { analyzeCss, fixCss, fixDeclarationList } from "../src/css.js";

test("check reports EPUB high-risk CSS declarations", () => {
  const result = analyzeCss(".a{text-spacing-trim:trim-start;text-indent:2em}");

  assert.equal(result.ok, false);
  assert.equal(result.issues[0].property, "text-spacing-trim");
});

test("fix removes known EPUB high-risk CSS and keeps normal declarations", () => {
  const result = fixCss(".a{text-spacing-trim:trim-start;text-combine:horizontal;color:black}");

  assert.equal(result.css.includes("text-spacing-trim"), false);
  assert.equal(result.css.includes("text-combine"), false);
  assert.equal(result.css.includes("color:black"), true);
});

test("inline style fixer removes unsafe declarations", () => {
  const output = fixDeclarationList("text-spacing-trim: trim-start; text-indent: 2em; color: black");

  assert.equal(output.includes("text-spacing-trim"), false);
  assert.equal(output.includes("text-indent: 2em"), true);
  assert.equal(output.includes("color: black"), true);
});

test("@font-face src is treated as a valid descriptor", () => {
  const result = analyzeCss('@font-face{font-family:"Book";src:url("../fonts/book.otf") format("opentype");font-weight:400}');

  assert.equal(result.ok, true);
});

test("@page margin declarations are treated as CSS properties", () => {
  const result = analyzeCss("@page{margin-top:0px;margin-bottom:0px}");

  assert.equal(result.ok, true);
});
