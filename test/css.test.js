import assert from "node:assert/strict";
import test from "node:test";
import { analyzeCss, analyzeDeclarationList, fixCss, fixDeclarationList } from "../src/css.js";

test("只移除非法text-justify拼字，不猜對齊且保留合法級聯", () => {
  const style='text-justify:inter-character;text-justify:inter-ideogrph!important;--justify:inter-ideogrph;content:"inter-ideogrph"';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css,/text-justify:\s*inter-ideogrph/);
    assert.match(css,/text-justify:\s*inter-character/);
    assert.match(css,/--justify:\s*inter-ideogrph/);
    assert.match(css,/content:\s*"inter-ideogrph"/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(fixCss(css).css).css,fixCss(css).css);
  }
});

test("移除margin-block破損的小數單位，不猜數值且保留合法級聯", () => {
  const style='margin-block:1rem 2rem;margin-block:6rem 3.rem!important;--spacing:3.rem;content:"3.rem"';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css,/margin-block:\s*6rem/);
    assert.match(css,/margin-block:\s*1rem 2rem/);
    assert.match(css,/--spacing:\s*3.rem/);
    assert.match(css,/content:\s*"3.rem"/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(fixCss(css).css).css,fixCss(css).css);
  }
  assert.equal(fixCss('p{margin-block:6rem 3.5rem}').ok,true);
  assert.match(fixCss('p{padding-inline:1rem 2rem}').css,/padding-inline:1rem 2rem/);
  assert.doesNotMatch(fixCss('p{margin-block:1rem 2rem 3rem}').css,/margin-block:/);
});

test("只移除未加前綴的非法文字描邊，保留WebKit宣告與字串", () => {
  const style='text-stroke:2px red;TEXT-STROKE-WIDTH:2px!important;text-stroke-color:#000;-webkit-text-stroke:2px red;-webkit-text-stroke-width:2px;-webkit-text-stroke-color:#000;--text-stroke-width:2px;content:"text-stroke:2px red"';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css, /(?:\{|;)\s*text-stroke(?:-width|-color)?:/i);
    assert.match(css, /-webkit-text-stroke:\s*2px red/);
    assert.match(css, /-webkit-text-stroke-width:\s*2px/);
    assert.match(css, /-webkit-text-stroke-color:\s*#000/);
    assert.match(css, /--text-stroke-width:\s*2px/);
    assert.match(css, /content:\s*"text-stroke:2px red"/);
    assert.equal(analyzeCss(css).ok, true);
    assert.equal(fixCss(fixCss(css).css).css, fixCss(css).css);
  }
});

test("移除clear誤用色碼，保留有效級聯、動態值與正文色彩", () => {
  const style='clear:both;CLEAR:#666!important;clear:#aBcD;clear:#12345678;clear:var(--clear);color:#666;--clear:#666;content:"clear:#666"';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css, /(?:\{|;)\s*clear:\s*#/i);
    assert.match(css, /clear:\s*both/);
    assert.match(css, /clear:\s*var\(--clear\)/);
    assert.match(css, /color:\s*#666/);
    assert.match(css, /--clear:\s*#666/);
    assert.match(css, /content:\s*"clear:#666"/);
    assert.equal(analyzeCss(css).ok, true);
    assert.equal(fixCss(css).css, fixCss(fixCss(css).css).css);
  }
  assert.equal(fixCss('p{clear:unknown-side}').ok, false);
});

test("移除無效多值字級，保留單值、動態字級與其他排版", () => {
  const style='font-size:1em;font-size:1.5 0.5em!important;font-size:calc(1em + 2px);margin:1.5em 0.5em;--size:1.5 0.5em';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css, /font-size:\s*1\.5\s+0\.5em/);
    assert.match(css, /font-size:\s*1em/);
    assert.match(css, /font-size:\s*calc/);
    assert.match(css, /margin:\s*1\.5em\s+0\.5em/);
    assert.match(css, /--size:\s*1\.5\s+0\.5em/);
    assert.equal(analyzeCss(css).ok, true);
    assert.equal(fixCss(css).css, fixCss(fixCss(css).css).css);
  }
});

test("移除裸數字字型名稱，不猜字重且保留合法字型名稱", () => {
  const style='font-family:serif;font-family:500!important;font-family:"500";font-weight:500;--family:500';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css, /font-family:\s*500\b/);
    assert.match(css, /font-family:\s*serif/);
    assert.match(css, /font-family:\s*"500"/);
    assert.match(css, /font-weight:\s*500/);
    assert.match(css, /--family:\s*500/);
    assert.equal(analyzeCss(css).ok, true);
    assert.equal(fixCss(css).css, fixCss(fixCss(css).css).css);
  }
});

test("修正margin-botom，保留字串、自訂屬性與優先權", () => {
  const style='MARGIN-BOTOM:1em!important;--margin-botom:custom;content:"margin-botom"';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(css, /margin-bottom:\s*1em\s*!important/);
    assert.match(css, /--margin-botom:\s*custom/);
    assert.match(css, /content:\s*"margin-botom"/);
    assert.equal(analyzeCss(css).ok, true);
    assert.equal(fixCss(css).css, fixCss(fixCss(css).css).css);
  }
  assert.equal(fixCss('p{margin-botom:unknown-size}').ok, false);
});

test("修正heigth拼字，保留優先權、自訂屬性、字串並驗證值", () => {
  const style='heigth:auto!important;HEIGHT:30%;--heigth:custom;content:"heigth:auto"';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(css, /height:\s*auto\s*!important/);
    assert.match(css, /--heigth:\s*custom/);
    assert.match(css, /content:\s*"heigth:auto"/);
    assert.equal(analyzeCss(css).ok, true);
    assert.equal(fixCss(css).css, fixCss(fixCss(css).css).css);
  }
  assert.equal(fixCss('p{heigth:unknown-size}').ok, false);
});

test("移除無效縮排與尺寸none，保留級聯、合法none及動態值", () => {
  const style='text-indent:2em;text-indent:none!important;height:auto;height:NONE;width:50%;width:none;max-height:none;display:none;--height:none;text-indent:var(--indent)';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css, /(?:\{|;)\s*(?:text-indent|height|width):\s*none\b/i);
    assert.match(css, /text-indent:\s*2em/);
    assert.match(css, /height:\s*auto/);
    assert.match(css, /width:\s*50%/);
    assert.match(css, /max-height:\s*none/);
    assert.match(css, /display:\s*none/);
    assert.match(css, /--height:\s*none/);
    assert.match(css, /var\(--indent\)/);
    assert.equal(analyzeCss(css).ok, true);
    assert.equal(fixCss(css).css, fixCss(fixCss(css).css).css);
  }
  assert.equal(fixCss('p{height:unknown-size}').ok, false);
});

test("移除成組的頂層 style_inside 匯出占位，但保留正常規則與字串", () => {
  const result = fixCss('\ufeff@charset "UTF-8";\nstyle_inside;\nstyle_inside;\nstyle_inside;\nstyle_inside;\np{color:blue} .style_inside{content:"style_inside;"}');
  assert.equal(result.ok, true);
  assert.equal(result.parserFallback, false);
  assert.match(result.css, /p\{color:blue\}/);
  assert.match(result.css, /\.style_inside\{content:"style_inside;"\}/);
  assert.equal(fixCss('unknown_marker; p{color:blue}').ok, false);
});

test("移除超出1到1000的字重常值，保留合法值、動態值及先前fallback", () => {
  const style = 'font-weight:400;font-weight:1200!important;font-weight:0;font-weight:-1;font-weight:750.5;font-weight:1000;font-weight:var(--weight)';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.equal(analyzeCss(css).ok, true);
    assert.doesNotMatch(css, /1200|font-weight:0[;} ]|font-weight:-1/);
    assert.match(css, /font-weight:\s*400/);
    assert.match(css, /750.5/);
    assert.match(css, /1000/);
    assert.match(css, /var\(--weight\)/);
  }
});

test("回報解析器恢復錯誤，只移除已確認的頂層 style_inside 占位文字", () => {
  const css = '@charset "UTF-8";style_inside;';
  assert.equal(analyzeCss(css).ok, false);
  const result = fixCss(css);
  assert.equal(result.ok, true);
  assert.doesNotMatch(result.css, /style_inside/);
  assert.equal(fixCss(result.css).css, result.css);
  const valid = 'style_inside{color:red}p::before{content:"style_inside;"}';
  assert.equal(fixCss(valid).ok, true);
  assert.match(fixCss(valid).css, /style_inside\{color:red\}/);
  assert.match(fixCss(valid).css, /content:"style_inside;"/);
  const unknown = fixCss('unknown_placeholder;');
  assert.equal(unknown.ok, false);
  assert.match(unknown.css, /unknown_placeholder/);
});

test("行內合法 important 不誤報語法錯誤，無效值仍回報", () => {
  const style = 'width:375px !important;color:rgb(10 20 30)!IMPORTANT';
  assert.deepEqual(analyzeDeclarationList(style), []);
  assert.deepEqual(analyzeDeclarationList(fixDeclarationList(style)), []);
  assert.match(fixDeclarationList(style), /!important/i);
  assert.equal(analyzeDeclarationList('width:nonsense !important').length, 1);
  assert.equal(analyzeDeclarationList('direction:rtl !important')[0].type, 'denied-declaration');
});

test("無單位的非零邊框寬度移除，不更動合法邊框、色彩函式與動態值", () => {
  const style = 'border:1px solid black;border:0.01 transparent solid;border-top:2 solid red;border-width:1 2;border-bottom-width:0.1;color:black';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.equal(analyzeCss(css).ok, true);
    assert.match(css, /border:\s*1px solid black/);
    assert.doesNotMatch(css, /0\.01|border-top|border-width|border-bottom-width/);
  }
  const valid = 'p{border:0 solid rgb(10 20 30);border-width:0 1px;border-top:var(--border)}';
  const fixed = fixCss(valid);
  assert.equal(fixed.ok, true);
  assert.match(fixed.css, /rgb\(10 20 30\)/);
  assert.match(fixed.css, /var\(--border\)/);
  assert.equal(fixCss(fixed.css).css, fixed.css);
});

test("私有出血屬性、無效陰影與 heigh 共用修復，不改合法陰影及頁面出血", () => {
  const style = 'qrbleed:left top right;zybleed:left;bleed:left top right;box-shadow:2% 2% 5% rgba(33,33,33,.6);box-shadow:#111 1px;heigh:1px;color:black';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.equal(analyzeCss(css).ok, true);
    assert.doesNotMatch(css, /bleed|box-shadow|heigh:/);
    assert.match(css, /height:\s*1px/);
    assert.match(css, /color:\s*black/);
  }
  const valid = 'p{box-shadow:1px 2px rgb(10% 20% 30%);box-shadow:var(--shadow)}@page{bleed:3mm}';
  const fixed = fixCss(valid);
  assert.equal(fixed.ok, true);
  assert.match(fixed.css, /box-shadow:1px 2px/);
  assert.match(fixed.css, /var\(--shadow\)/);
  assert.match(fixed.css, /bleed:3mm/);
  assert.equal(fixCss(fixed.css).css, fixed.css);
  assert.match(fixCss('p{box-shadow:future-shadow(2%)}').css, /future-shadow/);
});

test("缺分號與空值吞入下一個宣告時，僅分離可驗證的宣告並保留字串", () => {
  const broken = 'text-decoration:\r\ntext-align:left; margin-left:2em\r\nline-height:1.2em; content:"a:b"';
  assert.equal(analyzeCss(`p{${broken}}`).ok, false);
  for (const css of [fixCss(`p{${broken}}`).css, `p{${fixDeclarationList(broken)}}`]) {
    assert.equal(analyzeCss(css).ok, true);
    assert.match(css, /text-align:\s*left/);
    assert.match(css, /margin-left:\s*2em/);
    assert.match(css, /line-height:\s*1.2em/);
    assert.match(css, /content:\s*"a:b"/);
  }
  assert.equal(fixCss('p{color:nonsense\nmargin-left:invalid}').ok, false);
});

test("移除規則區塊開頭的空宣告分號", () => {
  const result = fixCss(".logo-top{;background-color:#8C5D31}");

  assert.equal(result.ok, true);
  assert.equal(result.css, ".logo-top{background-color:#8C5D31}");
  assert.equal(analyzeCss(result.css).ok, true);
});

test("正規化色碼內的全形十六進位字母", () => {
  for (const result of [fixCss("p{color:#dＣＤＣＤc}").css, `p{${fixDeclarationList("color:#dＣＤＣＤc")}}`]) {
    assert.match(result, /#dCDCDc/);
    assert.equal(analyzeCss(result).ok, true);
  }
});

test("色碼修復保留選擇器、字串與資源片段，掃描仍指出原始錯誤", () => {
  assert.equal(analyzeCss("p{color:#dＣＤＣＤc}").ok, false);
  const result = fixCss('#dＣＤＣＤc{content:"#dＣＤＣＤc";background:url(#dＣＤＣＤc);color:#dＣＤＣＤc}');
  assert.match(result.css, /#dＣＤＣＤc\{/);
  assert.match(result.css, /content:"#dＣＤＣＤc"/);
  assert.match(result.css, /url\(#dＣＤＣＤc\)/);
  assert.match(result.css, /color:#dCDCDc/);
  assert.equal(result.fixedIssues, 1);
});

test("清除 InDesign 專用註記區段並保留一般樣式", () => {
  const css = `a:focus,a:active { color: #0000ff; }
/* [InDesign專用：預設框架] */
.def-div { margin: 0; padding: 0; }
.def-paragraph { margin: 0; padding: 0; }
.def-image {}
/* 【InDesign專用：註腳段落前面的分隔線】 */
.HorizontalRule-1 { border-width: var(--bdw-custom); }
/* [InDesign專用：註腳參照編號] */
._idFootnoteLink { font-size: 0.6rem; }
/* [InDesign專用：註腳文字前方編號] */
._idFootnoteAnchor { font-size: 0.8em; }
/* 一般註記 */
.ordinary { display: block; }`;
  const result = fixCss(css);
  assert.equal(result.ok, true);
  assert.match(result.css, /a:focus,a:active/);
  assert.match(result.css, /\.ordinary/);
  assert.doesNotMatch(result.css, /\.def-div|\.def-paragraph|\.def-image|\.HorizontalRule-1|\._idFootnoteLink|\._idFootnoteAnchor/);
});

test("其他註記或隔開的 InDesign 規則不觸發清除", () => {
  const result = fixCss("/* [InDesign專用：框架] */\n/* 另有說明 */\n.def-div{margin:0}\n.HorizontalRule-1{border:0}");
  assert.match(result.css, /\.def-div/);
  assert.match(result.css, /\.HorizontalRule-1/);
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

test("移除無效的負值圓角並保留動態圓角", () => {
  for (const result of [fixCss("p{border-radius:-1em;border-radius:1em}").css, `p{${fixDeclarationList("border-radius:-1em;border-radius:1em")}}`]) {
    assert.doesNotMatch(result, /border-radius:\s*-1em/);
    assert.match(result, /border-radius:\s*1em/);
    assert.equal(analyzeCss(result).ok, true);
  }
  const dynamic = fixCss("p{border-radius:calc(1em - 2px);border-radius:var(--radius)}");
  assert.equal(dynamic.css, "p{border-radius:calc(1em - 2px);border-radius:var(--radius)}");
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

test("帶引號的誤置字重共用修復，保留優先權與合法字串", () => {
  for (const value of ['"bold"', "'bolder'!important", '"700"']) {
    const style=`font-style:${value};font-style:italic;--style:"bold";content:"bold"`;
    for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
      assert.match(css,/font-weight:\s*(?:bold|bolder|700)/);
      if (value.includes('important')) assert.match(css,/bolder\s*!important/);
      assert.match(css,/font-style:\s*italic/);
      assert.match(css,/--style:\s*"bold"/);
      assert.match(css,/content:\s*"bold"/);
      assert.equal(analyzeCss(css).ok,true);
      assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
    }
  }
  assert.equal(fixCss('p{font-style:"bold italic"}').ok,false);
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

test("修復誤寫在單邊寬度的邊框樣式", () => {
  for (const result of [fixCss("p{border-bottom-width:dashed 2px}").css, `p{${fixDeclarationList("border-bottom-width:dotted 3px")}}`]) {
    assert.match(result, /border-bottom:\s*(?:dashed 2px|dotted 3px)/);
    assert.equal(analyzeCss(result).ok, true);
  }
});

test("修復誤拆進 padding 值的單邊方向", () => {
  for (const result of [fixCss("p{padding:left:10px}").css, `p{${fixDeclarationList("padding:right:2em")}}`]) {
    assert.match(result, /padding-(?:left|right):\s*(?:10px|2em)/);
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

test("移除多看私有對齊及無效 ennter，不猜測錯字意圖並保留有效級聯", () => {
  const style = 'text-align:left;duokan-text-align:left;text-align:ennter!important;color:black';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css, /duokan-text-align|ennter/);
    assert.match(css, /text-align:\s*left/);
    assert.match(css, /color:\s*black/);
    assert.equal(analyzeCss(css).ok, true);
  }
});

test("保留已知 WebKit 區塊置中擴充，不改成不同語意的 center", () => {
  const style = 'text-align:-webkit-center!important';
  assert.equal(analyzeCss(`p{${style}}`).ok, true);
  assert.match(fixCss(`p{${style}}`).css, /text-align:-webkit-center!important/);
  const inline = fixDeclarationList(style);
  assert.match(inline, /-webkit-center/);
  assert.equal(analyzeCss(`p{${inline}}`).ok, true);
  assert.equal(analyzeCss('p{text-align:-webkit-unknown}').ok, false);
});

test("移除無效 normal 字級，保留既有字級、動態值及其他合法 normal", () => {
  const style = 'font-size:1.2em;font-size:normal!important;font-weight:normal;line-height:normal';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css, /font-size:\s*normal/i);
    assert.match(css, /font-size:\s*1.2em/);
    assert.match(css, /font-weight:\s*normal/);
    assert.match(css, /line-height:\s*normal/);
    assert.equal(analyzeCss(css).ok, true);
    const normalized = fixCss(css).css;
    assert.equal(fixCss(normalized).css, normalized);
  }
  for (const value of ['var(--size)', 'calc(1em + 2px)', 'medium', 'inherit']) {
    assert.equal(fixDeclarationList(`font-size:${value}`).replace(/\s*:\s*/, ':'), `font-size:${value}`);
  }
});

test("修正明確的 padding、文字顏色拼字及 regular 字重並保留優先權", () => {
  const style = 'paddin-bottom:1em;font-color:#707070;font-weight:regular!important';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(css, /padding-bottom:\s*1em/);
    assert.match(css, /color:\s*#707070/);
    assert.match(css, /font-weight:\s*normal\s*!important/);
    assert.equal(analyzeCss(css).ok, true);
    const normalized = fixCss(css).css;
    assert.equal(fixCss(normalized).css, normalized);
  }
});

test("移除含多個寬度的無效 border 縮寫，不猜測方向並保留有效級聯", () => {
  const style = 'border:1px solid red;border:0 0 2px 0!important;border-width:0 0 2px 0';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(css, /border:\s*1px solid red/);
    assert.doesNotMatch(css, /border:\s*0 0 2px 0/);
    assert.match(css, /border-width:\s*0 0 2px 0/);
    assert.equal(analyzeCss(css).ok, true);
    assert.equal(fixCss(fixCss(css).css).css, fixCss(css).css);
  }
  assert.match(fixCss('p{border:var(--border);border:0 solid rgb(0 0 0)}').css, /var\(--border\)/);
});

test("移除陰影缺單位的非零偏移，保留零、動態值及函式內數字", () => {
  const style = 'text-shadow:0 1px 1px #da9236;text-shadow:0 1 1px #da9236!important;box-shadow:0 1 1px black';
  for (const css of [fixCss(`p{${style}}`).css, `p{${fixDeclarationList(style)}}`]) {
    assert.match(css, /text-shadow:\s*0 1px 1px #da9236/);
    assert.doesNotMatch(css, /shadow:\s*0 1 /);
    assert.equal(analyzeCss(css).ok, true);
  }
  for (const value of ['0 0 #000', '1px 1px rgb(0 0 0)', 'var(--shadow)', '0 calc(1px + 2px) #000']) {
    assert.equal(analyzeCss(`p{text-shadow:${fixDeclarationList('text-shadow:'+value).split(':').slice(1).join(':')}}`).ok, true);
  }
});

test("僅清除宣告區塊中精確的孤立逗號3殘留，不刪未知破損或字串", () => {
  const css = 'p{color:red;, 3; font-size:1em;content:", 3;";--custom:", 3;"}';
  const result = fixCss(css);
  assert.equal(result.ok, true);
  assert.match(result.css, /color:red/);
  assert.match(result.css, /font-size:1em/);
  assert.match(result.css, /content:", 3;"/);
  assert.match(result.css, /--custom:", 3;"/);
  assert.equal(fixCss(result.css).css, result.css);
  assert.equal(fixCss('p{color:red;, 4;}').ok, false);
});

test("清除閱讀器私有qrfullpage，保留自訂屬性及合法宣告", () => {
  const style='qrfullpage:1;--qrfullpage:1;color:blue';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css, /(?:\{|;)\s*qrfullpage:/);
    assert.match(css,/--qrfullpage:\s*1/);
    assert.match(css,/color:\s*blue/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
});

test("只修精確的MS直排漏分號，保留MS與標準直排宣告", () => {
  const style='-ms-text-combine-horizontal: all\n text-combine-horizontal: all;text-combine-upright:all';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.match(css,/-ms-text-combine-horizontal:\s*all/);
    assert.match(css,/(?:\{|;)\s*text-combine-upright:\s*all/);
    assert.doesNotMatch(css,/(?:\{|;)\s*text-combine-horizontal:/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
  assert.equal(fixCss('p{-ms-text-combine-horizontal:all\n unknown-property:all}').ok,false);
});

test("修正字型列表中 misplaced important，保留字型、字串與未知語法", () => {
  const style='font-family:"st" !important, serif;color:red';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.match(css,/font-family:\s*"st",\s*serif\s*!important/);
    assert.match(css,/color:\s*red/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
  assert.match(fixCss('p{content:"st !important, serif";--custom:"st !important, serif"}').css,/content:"st !important, serif"/);
  assert.equal(fixCss('p{font-family:"st" !important, 1px}').ok,false);
});

test("移除無效裸rgba邊框，保留有效級聯、色彩函式與自訂屬性", () => {
  const style='border:1px solid red;border:1px rgba solid!important;border-top:1px solid rgba(0,0,0,.5);--border:1px rgba solid';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.match(css,/border:\s*1px solid red/);
    assert.doesNotMatch(css,/(?:\{|;)\s*border:\s*1px rgba solid/);
    assert.match(css,/border-top:\s*1px solid rgba\(/);
    assert.match(css,/--border:\s*1px rgba solid/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
  assert.match(fixCss('p{border:var(--border)}').css,/var\(--border\)/);
});

test("移除百分比邊框寬度，保留合法邊框與百分比圓角", () => {
  const style='border:1px solid red;border:0%!important;border-top:2% solid red;border-left-width:0%;border-radius:50%;--border:0%;border-bottom:var(--border)';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css,/(?:\{|;)\s*border(?:-top|-left-width)?:\s*\d+%/);
    assert.match(css,/border:\s*1px solid red/);
    assert.match(css,/border-radius:\s*50%/);
    assert.match(css,/--border:\s*0%/);
    assert.match(css,/border-bottom:\s*var\(--border\)/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
});

test("移除無效color both，不猜測為clear並保留有效級聯", () => {
  const style='color:red;color:both!important;clear:both;--color:both';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css,/(?:\{|;)\s*color:\s*both/);
    assert.match(css,/color:\s*red/);
    assert.match(css,/clear:\s*both/);
    assert.match(css,/--color:\s*both/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
});

test("直接負尺寸移除、text-middle正規化，保留動態值與合法負偏移", () => {
  const style='height:10px;height:-359px!important;min-width:-2%;max-height:-1em;width:0;margin:-2px;vertical-align:text-middle!important;--height:-359px;width:calc(100% - 2px);height:var(--height)';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css,/(?:\{|;)\s*(?:height|min-width|max-height):\s*-/);
    assert.match(css,/height:\s*10px/);
    assert.match(css,/vertical-align:\s*middle\s*!important/);
    assert.match(css,/margin:\s*-2px/);
    assert.match(css,/--height:\s*-359px/);
    assert.match(css,/calc\(/);
    assert.match(css,/var\(--height\)/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
});

test("移除一般宣告的auto字重，保留font-face描述符與合法級聯", () => {
  const style='font-weight:400;font-weight:AUTO!important;width:auto;font-family:auto;--weight:auto;font-weight:var(--weight)';
  for (const css of [fixCss(`p{${style}}`).css, fixDeclarationList(style)]) {
    assert.doesNotMatch(css,/(?:\{|;)\s*font-weight:\s*auto\b/i);
    assert.match(css,/font-weight:\s*400/);
    assert.match(css,/width:\s*auto/);
    assert.match(css,/font-family:\s*auto/);
    assert.match(css,/--weight:\s*auto/);
    assert.match(css,/font-weight:\s*var\(--weight\)/);
  }
  const face='@font-face{font-family:Book;src:url(book.otf);font-weight:auto}';
  assert.match(fixCss(face).css,/font-weight:\s*auto/);
  const result=fixCss('p{font-weight:400;font-weight:auto}');
  assert.equal(result.issues.length,0);
  assert.equal(fixCss(result.css).css,result.css);
});

test("移除非標準thin字重，不猜數字並保留合法級聯", () => {
  const style='font-weight:100;font-weight:thin!important;font-family:thin;--weight:thin';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css,/(?:\{|;)\s*font-weight:\s*thin/);
    assert.match(css,/font-weight:\s*100/);
    assert.match(css,/font-family:\s*thin/);
    assert.match(css,/--weight:\s*thin/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
});

test("僅修復line-height單一逗號小數，保留字串、自訂與動態值", () => {
  const style='line-height:1,5em!important;line-height:1,25;line-height:150,5%;--height:1,5em;font-family:"1,5em";height:var(--height)';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.match(css,/line-height:\s*1\.5em\s*!important/);
    assert.match(css,/line-height:\s*1\.25/);
    assert.match(css,/line-height:\s*150\.5%/);
    assert.match(css,/--height:\s*1,5em/);
    assert.match(css,/font-family:\s*"1,5em"/);
    assert.match(css,/height:\s*var\(--height\)/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
  assert.equal(fixDeclarationList('line-height:1,5em,2em'),'line-height: 1,5em,2em');
});

test("移除數值text-align，不猜縮排並保留合法級聯及動態值", () => {
  const style='text-align:right;text-align:-2em!important;text-align:0;text-align:20%;text-indent:-2em;--align:-2em;text-align:var(--align)';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css,/(?:\{|;)\s*text-align:\s*(?:-2em|0|20%)/);
    assert.match(css,/text-align:\s*right/);
    assert.match(css,/text-indent:\s*-2em/);
    assert.match(css,/--align:\s*-2em/);
    assert.match(css,/text-align:\s*var\(--align\)/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
});

test("修復ont-family漏字，保留字串、自訂值及優先權", () => {
  const style='ONT-family:serif!important;ont-family:"Book Font",sans-serif;--ont-family:serif;content:"ont-family:serif"';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css,/(?:\{|;)\s*ont-family:/i);
    assert.match(css,/font-family:\s*serif\s*!important/);
    assert.match(css,/font-family:\s*"Book Font",\s*sans-serif/);
    assert.match(css,/--ont-family:\s*serif/);
    assert.match(css,/content:\s*"ont-family:serif"/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
  assert.equal(analyzeCss(fixCss('p{unlisted-family:serif}').css).issues.length,1);
});

test("孤立background前綴只救回可驗證圓角，不猜背景或未知拼接", () => {
  const style='width:40px;background-\n border-radius:20px!important;background:white;content:"background-\\a border-radius:20px";--broken:background-';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.match(css,/border-radius:\s*20px\s*!important/);
    assert.match(css,/width:\s*40px/);
    assert.match(css,/background:\s*white/);
    assert.match(css,/--broken:\s*background-/);
    assert.match(css,/content:\s*"background-/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
  for (const raw of ['background-\n border-radius:mystery','background-\n color:red','unknown-\n border-radius:20px']) {
    assert.equal(fixCss(`p{${raw}}`).ok,false);
  }
});

test("Adobe私有斷字、valign及非法邊框全域關鍵字共用修復", () => {
  const style='adobe-hyphenate:auto;hyphens:auto;valign:top!important;border-top:1px solid red;border-top:initial solid 1px;--adobe-hyphenate:none;content:"adobe-hyphenate"';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css,/(?:\{|;)adobe-hyphenate:/);
    assert.match(css,/vertical-align:\s*top!important/);
    assert.match(css,/border-top:\s*1px solid red/);
    assert.doesNotMatch(css,/initial solid/);
    assert.match(css,/hyphens:\s*auto/);
    assert.match(css,/--adobe-hyphenate:\s*none/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
  assert.equal(fixCss('p{valign:mystery}').ok,false);
  assert.equal(fixCss('p{border-top:initial}').ok,true);
});

test("清除已知私有網格與標點對齊，舊系統文字色依標準對應CanvasText", () => {
  const style='line-height:1.5;layout-grid:49.85pt 0.2pt!important;text-justify-trim:punctuation;color:WindowText!important;--layout-grid:49.85pt;content:"layout-grid:49.85pt;color:windowtext"';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css,/(?:\{|;)\s*(?:layout-grid|text-justify-trim):/i);
    assert.match(css,/line-height:\s*1.5/);
    assert.match(css,/color:\s*CanvasText\s*!important/i);
    assert.match(css,/--layout-grid:\s*49.85pt/);
    assert.match(css,/content:\s*"layout-grid:49.85pt;color:windowtext"/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
  assert.equal(fixCss('p{color:mysterytext}').ok,false);
  assert.equal(fixCss('p{layout-grid-unknown:49.85pt}').ok,false);
  assert.equal(fixCss('p{color:var(--windowtext);--windowtext:black}').ok,true);
});

test("行內宣告以解析器辨識邊界，不拆開字串、函式或data URL內的分號", () => {
  const style='color:windowtext;content:"甲;layout-grid:1pt;乙";background-image:url("data:image/png;base64,AAAA");--note:"a;b";line-height:1.5';
  const fixed=fixDeclarationList(style);
  assert.match(fixed,/content:\s*"甲;layout-grid:1pt;乙"/);
  assert.match(fixed,/url\("data:image\/png;base64,AAAA"\)/);
  assert.match(fixed,/--note:\s*"a;b"/);
  assert.match(fixed,/line-height:\s*1.5/);
  assert.equal(analyzeCss(`p{${fixed}}`).ok,true);
  assert.equal(fixDeclarationList(fixed),fixed);
});

test("只移除已知Word私有標點與字型設定，保留標準字型及字串", () => {
  const style='font-family:serif;punctuation-wrap:simple;mso-bidi-font-family:華康細明體;mso-hansi-font-family:Calibri;mso-hansi-theme-font:minor-latin;mso-ascii-font-family:Calibri;mso-ascii-theme-font:minor-latin;mso-fareast-font-family:新細明體;mso-fareast-theme-font:minor-fareast;--mso-font:Calibri;content:"mso-ascii-font-family:Calibri"';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css,/(?:\{|;)\s*(?:mso-[\w-]+|punctuation-wrap):/);
    assert.match(css,/font-family:\s*serif/);
    assert.match(css,/--mso-font:\s*Calibri/);
    assert.match(css,/content:\s*"mso-ascii-font-family:Calibri"/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
  assert.equal(fixCss('p{mso-unknown:1}').ok,false);
});

test("驗證CSS Text 4斷字限制，保留合法設定而不豁免無效值", () => {
  for (const [property, values] of Object.entries({
    'hyphenate-limit-lines':['2','0','no-limit','inherit','var(--lines)'],
    'hyphenate-limit-zone':['10%','2em','0','calc(10% + 1px)','revert-layer'],
    'hyphenate-limit-last':['none','always','column','page','spread','unset'],
  })) for (const value of values) {
    const style=`${property}:${value}!important`;
    assert.equal(analyzeCss(`p{${style}}`).ok,true,style);
    const fixed=fixCss(`p{${style}}`);
    assert.equal(fixed.ok,true);assert.equal(fixed.fixedIssues,0);
    assert.match(fixed.css,new RegExp(property+':'));
    assert.equal(analyzeCss(`p{${fixDeclarationList(style)}}`).ok,true);
  }
  for (const style of ['hyphenate-limit-lines:-1','hyphenate-limit-lines:1.5','hyphenate-limit-zone:banana','hyphenate-limit-last:sometimes','hyphenate-limit-unknown:2']) {
    assert.equal(analyzeCss(`p{${style}}`).ok,false,style);
    assert.equal(fixCss(`p{${style}}`).ok,false,style);
  }
});

test("移除無效undererline裝飾，保留合法級聯與自訂值", () => {
  const style='text-decoration:underline;text-decoration:undererline!important;--decoration:undererline';
  for (const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]) {
    assert.doesNotMatch(css,/(?:\{|;)\s*text-decoration:\s*undererline/);
    assert.match(css,/text-decoration:\s*underline/);
    assert.match(css,/--decoration:\s*undererline/);
    assert.equal(analyzeCss(css).ok,true);
    assert.equal(fixCss(css).css,fixCss(fixCss(css).css).css);
  }
});
