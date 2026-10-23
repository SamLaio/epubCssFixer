import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeCss, fixCss, fixDeclarationList } from '../src/css.js';
test('修正單一命名色誤加井號，保留合法色碼、字串與未知值', () => {
 const style='border-left-color:#black!important;color:#red;background-color:#fff;--color:#black;content:"#black"';
 for(const css of [fixCss(`p{${style}}`).css,`p{${fixDeclarationList(style)}}`]){
  assert.match(css,/border-left-color:\s*black!important/);assert.match(css,/color:\s*red/);assert.match(css,/#fff/);
  assert.match(css,/--color:\s*#black/);assert.match(css,/content:\s*"#black"/);assert.equal(analyzeCss(css).ok,true);
  assert.equal(fixCss(fixCss(css).css).css,fixCss(css).css);
 }
 assert.match(fixCss('p{color:#notacolor;fill:url(#black);color:#bad}').css,/#notacolor/);
 assert.match(fixCss('p{color:#bad}').css,/#bad/);
});
