import test from "node:test";
import assert from "node:assert/strict";
import { fixCss } from "../src/css.js";

test("修復漏分號、舊直排值與已確認的排版宣告", () => {
  const out = fixCss("p{font-size:1.6em margin:0em 0em 2em 0em}table{with:100%}i{writing-mode:tb-lr;font-size:24;line-height:auto;font-weight:none;letter-spacing:letterSpacingem}");
  assert.equal(out.ok, true);
  assert.match(out.css, /font-size:1.6em;margin:/);
  assert.match(out.css, /width:100%/);
  assert.match(out.css, /writing-mode:vertical-lr/);
  assert.equal(fixCss(out.css).css, out.css);
});
