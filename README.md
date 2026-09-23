# epubCssFixer 0.1.1

舊式 `text-justify: inter-ideograph` 以 `inter-character` 提供現行字間對齊相容寫法；`writing-mode: horizontal` 修為 `horizontal-tb`，不改動既有直排。負 padding 常值及非零缺單位的 margin/padding 宣告會移除，不猜測原作者想用的單位。動態 `calc()` / `var()`、先前合法宣告及合法負 margin 保留。參考 [CSS Text](https://www.w3.org/TR/css-text-3/#text-justify-property)、[CSS Box Model](https://www.w3.org/TR/css-box-3/#padding-physical) 與 [CSS Writing Modes](https://www.w3.org/TR/css-writing-modes-3/#block-flow)。

`widows`／`orphans` 的正整數若被誤加長度單位，會保留數字；帶小數長度與 `auto` 則移除。`font-family` 首尾多餘逗號會移除；`vertical-align: center` 與 `duokan-middle-line` 改為 `middle`，無效的 `vertical-align: right` 或 `0 auto` 移除。`text-align: justify-all` 改為 `justify`，`text-align: top` 改為等效的 `vertical-align: top`，舊式 `writing-mode: vertical-tb` 改為保留直排語意的 `vertical-rl`。無單位 `font-size` 補 `px`，`font-style` 誤填尺寸改為 `font-size`，`text-orientation` 誤填 `vertical-rl`／`vertical-lr` 改為 `writing-mode`。無效的 `float: top`、`float: center`、空 `quotes`、`inline-height`、Kindle 私有 `tb-*` 屬性、含 `auto` 的 padding、長邊距中的多值寫法與不存在的 `page-break` 屬性會刪除，效果與瀏覽器忽略該宣告一致。六位色碼缺少 `#` 時會補上；五位且各位相同的十六進位色碼會補成六位。明確的 `line-hegiht`／`hight` 拼字錯誤分別改為 `line-height`／`height`，誤把完整邊框縮寫寫在 `border-style` 時改回 `border`。

`epubCssFixer` 是獨立的 EPUB CSS 檢查與安全修復工具。

它不是 EPUB 結構修復器；OPF、nav、NCX、XHTML 結構修復仍交給 `epub223`。本工具專心處理 CSS 檔、`<style>` 區塊與 inline `style`。

## 功能

- 檢查單一 CSS 檔。
- 修復單一 CSS 檔。
- 掃描 EPUB 內 CSS 問題。
- 修復 EPUB 內 CSS，輸出新的 EPUB。
- 產生 JSON 報告，方便 `epub223` 或批次腳本接續處理。

## 目前會自動移除的 CSS

- `text-spacing-trim`
- `text-combine-horizontal: all`
- `text-combine: horizontal`
- `duokan-text-indent`
- `duokan-bleed`
- `oeb-column-number`
- `direction`
- 含 `file:`、`res:/`、遠端 `http(s)://` 的 `url(...)`
- 遠端或本機資源的 `@import`
- 遠端或本機資源的 `@font-face`

同時會正規化：

- 全形百分比 `％` -> `%`
- 全形冒號 `：` -> `:`
- CSS 規則區塊開頭多餘的空宣告分號，例如 `{;color: ...}` -> `{color: ...}`

## 使用方式

- 安全錯值修復涵蓋 `text-align: middle`、`letter-spacing: auto`、誤加引號的合法關鍵字／長度，
  以及舊式 `text-orientation: vertical-right`（改為 `mixed`，不改直排方向）。
- 移除無效的 `height/width: clientHeight/clientWidth`、空色碼 `"#"` 與私有 `oeb-column-number`；將舊式非零純數值 `width`／`height` 補為像素，並修正 `font-weight: blod`。
- 修復尺寸值前誤加的單一冒號（例如 `width: :5em`），以及 `background-position`／`background-repeat` 重複的全域值 `initial initial`。
- 將無單位的非零 `text-indent` 視為 `em`；移除無效的邊框色零值，並補齊五位十六進位色碼的最後一碼。
- 修復常見 CSS 屬性拼字錯誤，例如 `dispaly` -> `display`。
- 將誤寫在 `font-style` 的字重值（例如 `bold`）修為 `font-weight`。
- 將誤放在 `text-decoration` 的 `filled-sesame` 改為 `text-emphasis-style: filled sesame`，保留日文／中文著重點效果。
- `size` 只作為 `@page` 描述子保留，移除誤放在普通樣式中的 `size`。
- 將誤放在 `font-variant-east-asian` 的 `salt` 改為 OpenType 標準 `font-feature-settings: "salt" 1`；補齊字型名稱與通用字族之間遺漏的逗號，並移除無效的百分比 `border-width`。
- 保留合法字串及 `var()`；後者的計算結果不在靜態 lexer 驗證範圍，不誤報為語法錯誤。
- JSON `ok: false` 或 CLI 結束碼 `2` 表示仍有問題，即使已輸出 EPUB，也不可當成驗證通過。
  `fix-epub` 另回傳 `changed` 與 `fixedIssues`，供批次流程正確統計。
  [EPUB 舊式文字方向對照](https://www.w3.org/TR/epub-33/#sec-css-writing-modes)供修復規則參考。

如果尚未安裝依賴：

```powershell
pnpm install
```

檢查 CSS：

```powershell
node .\bin\epub-css-fixer.js check .\style.css --json
```

修復 CSS：

```powershell
node .\bin\epub-css-fixer.js fix .\style.css -o .\style.fixed.css --json
```

掃描 EPUB：

```powershell
node .\bin\epub-css-fixer.js scan-epub .\book.epub --json
```

修復 EPUB：

```powershell
node .\bin\epub-css-fixer.js fix-epub .\book.epub -o .\book.fixed.epub --json
```

顯示版本：

```powershell
node .\bin\epub-css-fixer.js --version
```

## 與 epub223 的關係

建議後續在 `epub223` 中把本工具當成 CSS 專用子流程：

1. `epub223` 解包或準備 EPUB 工作檔。
2. 呼叫 `epubCssFixer` 掃描/修復 CSS。
3. `epub223` 繼續處理 OPF、nav、XHTML 結構。
4. 最後用 EPUBCheck 驗證。

## 設計限制

- v0.1.1 只做保守修復，不會自動刪除所有 CSS lexer 覺得可疑的宣告。
- CSS 語法完全壞掉時會回報 parse error，仍會嘗試做安全的 regex fallback 修復。
- EPUB 打包會重新輸出 zip；`mimetype` 會以未壓縮方式寫入。

## 驗證

```powershell
node --test
```
