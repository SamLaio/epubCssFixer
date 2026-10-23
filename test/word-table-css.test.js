import assert from 'node:assert/strict';
import test from 'node:test';
import {analyzeCss,fixCss,fixDeclarationList} from '../src/css.js';
test('清除精確Word表格私有屬性及舊網格，保留未知擴充',()=>{
 const names=['mso-style-name','mso-tstyle-rowband-size','mso-tstyle-colband-size','mso-style-noshow','mso-style-unhide','mso-style-parent','mso-padding-alt','mso-pagination','mso-para-margin','mso-para-margin-bottom','layout-grid-mode'];
 const input=names.map(n=>`${n}:0`).join(';')+';text-autospace:none!important;color:black;--mso-style-name:keep;content:"mso-style-name"';
 for(const css of [fixCss(`p{${input}}`).css,`p{${fixDeclarationList(input)}}`]){
  for(const n of names)assert.doesNotMatch(css,new RegExp(`(?<![-\\w])${n}:`));
  assert.match(css,/text-autospace:\s*no-autospace!important/);assert.match(css,/--mso-style-name/);assert.equal(analyzeCss(css).ok,true);
  assert.equal(fixCss(fixCss(css).css).css,fixCss(css).css);
 }
 assert.match(fixCss('p{mso-unknown:0}').css,/mso-unknown/);
});
