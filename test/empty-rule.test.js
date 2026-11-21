import test from "node:test";
import assert from "node:assert/strict";
import { analyzeCss, fixCss, removeEmptyStyleRules } from "../src/css.js";

test("removes empty style rules but keeps layer order and keyframes", () => {
  const css = 'p{/* empty */} @media print { i{} b{color:red} } @layer base{} @keyframes a{to{}}';
  assert.equal(analyzeCss(css).issues.filter(issue => issue.type === "empty-rule").length, 2);
  assert.equal(removeEmptyStyleRules(css), ' @media print {  b{color:red} } @layer base{} @keyframes a{to{}}');
  assert.equal(fixCss(css).issues.length, 0);
});
