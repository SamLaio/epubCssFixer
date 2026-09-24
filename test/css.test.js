import assert from "node:assert/strict";
import test from "node:test";
import { analyzeCss, fixCss, fixDeclarationList } from "../src/css.js";

test("移除規則區塊開頭的空宣告分號", () => {
  const result = fixCss(".logo-top{;background-color:#8C5D31}");

  assert.equal(result.ok, true);
  assert.equal(result.css, ".logo-top{background-color:#8C5D31}");
  assert.equal(analyzeCss(result.css).ok, true);
});

test("舊式對齊、橫排錯值及非法間距共用保守修復", () => {
  const style = "text-justify:inter-ideograph!important;text-justify:distribute;writing-mode:horizontal;padding-bottom:1em;padding-bottom:-.1em;padding:1em -2px;margin-left:-2em;margin:0.2;margin:0 auto 0 em;margin:3em 0 1em 0 0;padding-inline:0 -1%;padding-top:calc(1em - 2px);padding-left:var(--pad)";
  for (const result of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(result, /inter-character\s*!important/);
    assert.match(result, /writing-mode:\s*horizontal-tb/);
    assert.doesNotMatch(result, /inter-ideograph|distribute|padding-bottom:\s*-|padding:\s*1em -|padding-inline|margin:\s*0.2|margin:\s*0 auto 0 em|margin:\s*3em/);
    assert.match(result, /padding-bottom:\s*1em/);
    assert.match(result, /margin-left:\s*-2em/);
    assert.match(result, /calc\(/);
    assert.match(result, /var\(--pad\)/);
    assert.equal(analyzeCss(result).ok, true);
  }
  const valid = fixCss("p{padding:-0em;margin:0 auto;writing-mode:vertical-rl}");
  assert.equal(valid.css, "p{padding:-0em;margin:0 auto;writing-mode:vertical-rl}");
});

test("修復計數屬性的誤加單位、字型首尾逗號及無效排版值", () => {
  const style = "widows:1em;orphans:2px;font-family:serif,;font-family:,serif;font-family:\"Source Han Serif TW\",inherit;float:top;vertical-align:center;page-break:avoid;color:black";
  for (const result of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(result, /widows:\s*1/);
    assert.match(result, /orphans:\s*2/);
    assert.match(result, /font-family:\s*serif/);
    assert.match(result, /vertical-align:\s*middle/);
    assert.doesNotMatch(result, /1em|2px|serif,|inherit|float|page-break|vertical-align:\s*center/);
    assert.match(result, /Source Han Serif TW/);
    assert.equal(analyzeCss(result).ok, true);
}

test("修復多看私有屬性與明確非法 CSS 值", () => {
  const result = fixCss("p{duokan-bleed:leftright;padding:0 auto;padding-top:0 auto;widows:0.5em;float:center;vertical-align:duokan-middle-line;color:#66666}");
  assert.equal(result.ok, true);
  assert.doesNotMatch(result.css, /duokan-bleed|padding-top|widows|float/);
  assert.match(result.css, /vertical-align:middle/);
  assert.match(result.css, /color:#666666/);
});

test("修復缺井號色碼、空引號及明確拼錯的屬性", () => {
  const style = 'border-color:ff0000;color:color:#00008B;quotes:"","";orphans:auto;widows:auto;inline-height:.1em;vertical-align:right;line-hegiht:1.6em;border-style:solid 1px #6e5336';
  for (const result of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(result, /border-color:\s*#ff0000/);
    assert.match(result, /color:\s*#00008B/);
    assert.match(result, /line-height:\s*1.6em/);
    assert.match(result, /border:\s*solid 1px #6e5336/);
    assert.doesNotMatch(result, /color:\s*color|quotes|orphans|widows|inline-height|vertical-align|line-hegiht|border-style/);
    assert.equal(analyzeCss(result).ok, true);
  }
});

test("修復舊式直排與明確無效的對齊值", () => {
  const style = "text-align:justify-all;writing-mode:vertical-tb;vertical-align:0 auto";
  for (const result of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(result, /text-align:\s*justify/);
    assert.match(result, /writing-mode:\s*vertical-rl/);
    assert.doesNotMatch(result, /justify-all|vertical-tb|vertical-align/);
    assert.equal(analyzeCss(result).ok, true);
  }
});

test("修復 EPUB 常見遺留屬性、字重拼字與純數值尺寸", () => {
  const style = "oeb-column-number:1;font-weight:blod;width:10;height:40;width:0";
  for (const result of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(result, /oeb-column-number|blod/);
    assert.match(result, /font-weight:\s*bold/);
    assert.match(result, /width:\s*10px/);
    assert.match(result, /height:\s*40px/);
    assert.match(result, /width:\s*0/);
    assert.equal(analyzeCss(result).ok, true);
  }
});

test("修復 display 的常見拼字錯誤", () => {
  for (const result of [fixCss("p{dispaly:block}").css, `p{${fixDeclarationList("dispaly:block")}}`]) {
    assert.match(result, /display:\s*block/);
    assert.equal(analyzeCss(result).ok, true);
  }
});

test("修復誤寫成 font-style 的字重", () => {
  for (const result of [fixCss("p{font-style:bold}").css, `p{${fixDeclarationList("font-style:bold")}}`]) {
    assert.match(result, /font-weight:\s*bold/);
    assert.equal(analyzeCss(result).ok, true);
  }
});

test("修復尺寸前多餘冒號與重複全域背景值", () => {
  const style = "width::5em;background-position:initial initial;background-repeat:initial initial";
  for (const result of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(result, /width:\s*5em/);
    assert.match(result, /background-position:\s*initial/);
    assert.match(result, /background-repeat:\s*initial/);
    assert.doesNotMatch(result, /::5em|initial initial/);
    assert.equal(analyzeCss(result).ok, true);
  }
});

test("修復文字縮排、邊框色零值與五位色碼", () => {
  const style = "text-indent:2;border-bottom-color:0;color:#56656";
  for (const result of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(result, /text-indent:\s*2em/);
    assert.match(result, /color:\s*#566566/);
    assert.doesNotMatch(result, /border-bottom-color|#56656(?:[;}])/);
    assert.equal(analyzeCss(result).ok, true);
  }
});

test("移除誤放進 CSS 的表格屬性與無效最大尺寸", () => {
  const style = "cellspacing:0;cellpadding:0;max-height:auto;max-width:auto;width:100%";
  for (const result of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(result, /cellspacing|cellpadding|max-height|max-width/);
    assert.match(result, /width:\s*100%/);
    assert.equal(analyzeCss(result).ok, true);
  }
});

test("修復書庫常見 CSS 拼寫、錯置屬性與私有屬性", () => {
  const style = "font-size:10;font-style:1.1em;vertical-align:text-baseline;text-orientation:vertical-rl;border-top:8px solid transpatrnt;hight:100px;cssword-break:break-all;white-spack:pre;text-align:lift;text-align:top;text-align:bottom;tb-text-size-fixed:yes;tb-vertical-align:45%";
  for (const result of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(result, /font-size:\s*10px/);
    assert.match(result, /font-size:\s*1.1em/);
    assert.match(result, /vertical-align:\s*baseline/);
    assert.match(result, /writing-mode:\s*vertical-rl/);
    assert.match(result, /border-top:\s*8px solid transparent/);
    assert.match(result, /height:\s*100px/);
    assert.match(result, /word-break:\s*break-all/);
    assert.match(result, /white-space:\s*pre/);
    assert.match(result, /text-align:\s*left/);
    assert.match(result, /vertical-align:\s*top/);
    assert.match(result, /vertical-align:\s*bottom/);
    assert.doesNotMatch(result, /font-style|text-orientation|hight|cssword-break|white-spack|text-align:\s*top|tb-/);
    assert.equal(analyzeCss(result).ok, true);
  }
});
});

test("已知錯值在樣式表與行內樣式共用安全修復", () => {
  const style = 'text-align:middle;letter-spacing:auto;font-style:"italic";height:clientHeight;color:"#";size:"1px";text-orientation:vertical-right';
  const fixed = fixCss(`p{${style}}`);
  assert.equal(fixed.ok, true);
  assert.match(fixed.css, /text-align:center/);
  assert.match(fixed.css, /font-style:italic/);
  assert.match(fixed.css, /letter-spacing:normal/);
  assert.match(fixed.css, /text-orientation:mixed/);
  assert.doesNotMatch(fixed.css, /clientHeight|color:/);
  assert.equal(analyzeCss(`p{${fixDeclarationList(style)}}`).ok, true);
  assert.equal(fixDeclarationList('font-style:"italic" !important'), 'font-style: italic !important');
  assert.equal(fixCss('@page{size:"1px"}').css, '@page{size:1px}');
});

test("保留合法字串、自訂變數與未知錯值", () => {
  const result = fixCss('p{font-family:"Book Font";content:"italic";color:var(--白);width:3em;unknown-value:bad}');
  assert.match(result.css, /font-family:"Book Font"/);
  assert.match(result.css, /content:"italic"/);
  assert.match(result.css, /var\(--白\)/);
  assert.match(result.css, /width:3em/);
  assert.equal(result.ok, false);
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].property, "unknown-value");
});

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

test("正規化全形 CSS 色碼井號", () => {
  const result = fixCss("p{color:＃1E90FF}");

  assert.equal(result.ok, true);
  assert.match(result.css, /color:#1E90FF/);
});

test("正規化全形 CSS 函式括號", () => {
  const result = fixCss("p{background:rgba（246,243,238,0.4）}");
  assert.equal(result.ok, true);
  assert.match(result.css, /rgba\(246,243,238,0\.4\)/);
});

test("修正 mini-height 並移除誤放的 colspan", () => {
  const result = fixCss("p{mini-height:60px;colspan:4}");

  assert.equal(result.ok, true);
  assert.match(result.css, /min-height:60px/);
  assert.doesNotMatch(result.css, /mini-height|colspan/);
});

test("修正 margin-left 的常見拼寫錯誤", () => {
  const result = fixCss("p{margin-lft:1.6em}");
  assert.equal(result.ok, true);
  assert.match(result.css, /margin-left:1.6em/);
});

test("修正遺漏開頭連字號的 WebKit 文字強調屬性", () => {
  for (const result of [fixCss("p{webkit-text-emphasis:filled circle}").css, `p{${fixDeclarationList("webkit-text-emphasis:filled circle")}}`]) {
    assert.match(result, /-webkit-text-emphasis:\s*filled circle/);
    assert.equal(analyzeCss(result).ok, true);
  }
});

test("修復誤放到 text-decoration 的芝麻文字強調", () => {
  for (const result of [fixCss("p{text-decoration:filled-sesame}").css, `p{${fixDeclarationList("text-decoration:filled-sesame")}}`]) {
    assert.match(result, /text-emphasis-style:\s*filled sesame/);
    assert.equal(analyzeCss(result).ok, true);
  }
});

test("修復東亞 OpenType 特徵、字型清單遺漏逗號與無效百分比邊框", () => {
  const style = 'font-variant-east-asian:salt;font-family:cursive,"BiauKai","DFKai-SB","KaiTi","STKaiti"serif,;border-width:30%;color:black';
  for (const result of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(result, /font-feature-settings:\s*"salt"\s*1/);
    assert.match(result, /"STKaiti",serif/);
    assert.doesNotMatch(result, /border-width/);
    assert.equal(analyzeCss(result).ok, true);
  }
});
