# epubCssFixer 0.1.7

依 [W3C CSS Text 4](https://www.w3.org/TR/css-text-4/#hyphenation) 驗證 `hyphenate-limit-lines`、`hyphenate-limit-zone`、`hyphenate-limit-last`；合法斷字設定保留，非法值及未知屬性仍回報，不因語法資料庫未收錄而刪除。

無效 `text-justify:inter-ideogrph` 會移除，不猜測對齊意圖；合法 `inter-character`、字串及自訂屬性保留。依 [W3C text-justify 定義](https://www.w3.org/TR/css-text-3/#text-justify-property) 檢查。

`margin-block` 的尺寸若為 `3.rem` 等非法小數單位，移除整條無效宣告，不猜成 `3rem` 或 `3.5rem`；保留既有合法級聯、自訂屬性與字串。

只移除未加前綴的非法 `text-stroke`、`text-stroke-width`、`text-stroke-color`，維持閱讀器原本忽略它們的行為，不猜改成有效描邊；保留 [WHATWG 相容規範](https://compat.spec.whatwg.org/#text-fill-and-stroking) 的 `-webkit-` 描邊、自訂屬性及字串。

清除 Adobe 私有 `adobe-hyphenate`，保留標準 `hyphens`；已知 `valign:top/middle/bottom/baseline` 改為 `vertical-align`。邊框縮寫不能混合 `initial` 等全域關鍵字與其他值，會移除整條無效宣告，不猜邊框色彩；合法單獨全域值、字串與自訂屬性保留。

`clear` 不接受十六進位色碼，修復會移除這類無效宣告，不猜改成文字色彩；保留合法級聯、`var()`、其他色彩、字串與自訂屬性。依 [W3C clear 定義](https://www.w3.org/TR/CSS2/visuren.html#propdef-clear) 處理。

孤立 `background-` 後換行吞入 `border-radius` 時，只在圓角值可驗證的情況下移除破損前綴、保留圓角；未知拼接仍回報，不猜背景色或背景圖片。

字型屬性漏字 `ont-family` 修為 `font-family`，適用外部、內嵌與行內 CSS；保留字串、自訂屬性、字型順序及優先權，修正後仍驗證值，不猜其他未知屬性。

`text-align` 的單一數字、長度或百分比不是合法對齊值，移除無效宣告，不猜成縮排；保留合法對齊級聯、`text-indent`、動態函式及自訂屬性。

`font-size` 若同時包含多個裸數字／長度／百分比（如 `1.5 0.5em`），移除無效宣告，不猜選其中的尺寸；合法單值與動態函式保留。

`font-family` 的單一裸數字（如 `500`）為無效宣告，直接移除；保留合法引號字型名稱、既有 fallback 與字重，不猜排版意圖。

已核實的 `margin-botom` 拼字錯誤改為 `margin-bottom`；行內與樣式表共用規則，保留字串、自訂屬性及優先權，修正後仍驗證值。

尺寸屬性拼字 `heigth` 沿用既有 `hight`／`heigh` 規則修為 `height`；修正後仍驗證值，不猜未知尺寸。適用外部、內嵌與行內 CSS，自訂屬性、字串及優先權保留。

`line-height` 的單一逗號小數（如 `1,5em`）只在改為點號後通過 CSS 驗證時修復；字串、自訂值、動態值與多段逗號不變。

非法 `font-weight:thin` 及一般宣告的 `font-weight:auto` 會移除並保留先前合法字重，不猜測作者要用哪個數字字重；`@font-face` 的合法 `font-weight:auto` 描述符、同名字型、動態及自訂值保留。

寬高與最小／最大尺寸的直接負值會移除，保留合法級聯、負邊距、動態函式及自訂屬性；`vertical-align:text-middle` 正規化為 `middle`。尺寸與對齊依 [W3C CSS 定義](https://www.w3.org/TR/CSS2/visudet.html) 檢查，不猜測未知值。

無效的 `text-indent:none`、`height:none`、`width:none` 會移除，不猜測為零或自動尺寸；保留先前合法級聯、`max-height:none`、`display:none`、自訂屬性與動態值。依 [CSS 縮排](https://www.w3.org/TR/css-text-3/#text-indent-property) 與 [CSS 首選尺寸](https://www.w3.org/TR/css-sizing-3/#preferred-size-properties) 規範處理。

字型列表的 `!important` 錯置於逗號前時，只有列表可通過語法驗證才將優先權移到尾端；未知破損仍回報。邊框內無參數的裸 `rgba` 是無效值，移除整條宣告而不猜色碼，保留有效級聯及 `rgba()`。參考 [CSS 優先權](https://www.w3.org/TR/css-cascade-5/#importance) 與 [邊框縮寫](https://www.w3.org/TR/css-backgrounds-3/#the-border-shorthands)。

無效 `color:both` 會移除，不改猜為 `clear:both`；先前有效色彩、真正的 clear 宣告與 CSS 自訂屬性保留。

私有 `qrfullpage` 宣告會清除，`--qrfullpage` 自訂屬性不動；精確的 `-ms-text-combine-horizontal:all` 後換行漏分號、接 `text-combine-horizontal:all` 的匯出破損會保留 MS 宣告並清除無效舊宣告，合法 `text-combine-upright` 與未知拼接保留。

無效的多寬度 `border:0 0 2px 0` 與缺單位的陰影偏移 `text-shadow:0 1 1px #da9236` 會移除，不猜測作者原意；保留合法 `border-width`、有效級聯、零及動態值。僅清除宣告區塊中的完整孤立 `, 3;` 匯出殘留，字串、自訂值與未知破損仍保留。依 [CSS 邊框縮寫](https://www.w3.org/TR/css-backgrounds-3/#the-border-shorthands) 與 [文字陰影](https://www.w3.org/TR/css-text-decor-3/#text-shadow-property) 規範處理。

清除多看私有 `duokan-text-align`；移除無效的 `text-align:ennter`，不猜測成其他對齊，保留先前有效級聯。

已知 `text-align:-webkit-center` 為 WebKit 區塊置中擴充，掃描保留，不誤改成只對行內內容置中的標準 `center`；未知擴充值仍回報。參考 [MDN 的非標準區塊對齊說明](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-align)。

無效的 `font-size:normal` 會移除，不猜測原作者希望的字級；先前合法字級、`var()`／`calc()` 及其他屬性的合法 `normal` 保留。依 [CSS Fonts 字級規範](https://www.w3.org/TR/css-fonts-4/#font-size-prop) 處理。

明確拼字 `paddin-bottom`／`font-color` 分別改為 `padding-bottom`／`color`；`font-weight:regular` 改為標準的 `normal`，保留宣告值與優先權。

CSS 掃描與修復保留空的自閉 `<style/>`，只解析有結束標籤的樣式區塊，避免 Kobo 空樣式誤吞下一個區塊。

字重單一常值超出 1–1000 時移除無效宣告，不猜測字重；合法小數、動態值與既有 fallback 保留。依 [CSS Fonts 字重規範](https://www.w3.org/TR/css-fonts-4/#font-weight-prop) 處理。

CSS 解析器自動恢復的錯誤也會回報；`fix`／`fix-epub` 只移除頂層完整的 `style_inside;` 匯出占位文字。同名合法選擇器、字串及未知殘留不會被猜測刪除。

行內樣式的 `!important` 以 CSS 宣告語法解析，合法優先權不會誤報為值錯誤，也不會在修復時刪除。

邊框縮寫／寬度含無單位非零常值（例如 `border:0.01 transparent solid`）時會移除該無效宣告，不猜測單位；合法零值、長度、色彩函式、`var()` 與先前的有效邊框保留。

已知私有 `qrbleed`／`zybleed`、方向列表形式的無效 `bleed` 會移除；合法 `@page{bleed:3mm}` 保留。`heigh` 改為 `height`。無效 `box-shadow` 的直接百分比尺寸或只有一個偏移長度會移除，不猜測原尺寸；合法陰影、色彩函式內百分比、`var()` 與未知新語法保留。依 [CSS 陰影規範](https://www.w3.org/TR/css-backgrounds-3/#box-shadow) 與 [分頁出血描述子](https://www.w3.org/TR/css-page-3/#bleed-area) 處理。

空宣告值或缺漏分號吞入下一個宣告時，修復器只拆分能逐項通過標準屬性驗證的內容；無法安全判斷的值留在錯誤報告，不誤拆字串或 URL。

舊式 `text-justify: inter-ideograph` 或 `distribute` 以 `inter-character` 提供現行字間對齊相容寫法；`writing-mode: horizontal` 修為 `horizontal-tb`，不改動既有直排。負 padding 與 `border-radius` 常值及非零缺單位的 margin/padding 宣告會移除，不猜測原作者想用的單位。動態 `calc()` / `var()`、先前合法宣告及合法負 margin 保留。參考 [CSS Text](https://www.w3.org/TR/css-text-3/#text-justify-property)、[CSS Box Model](https://www.w3.org/TR/css-box-3/#padding-physical) 與 [CSS Writing Modes](https://www.w3.org/TR/css-writing-modes-3/#block-flow)。

`widows`／`orphans` 的正整數若被誤加長度單位，會保留數字；帶小數長度與 `auto` 則移除。`font-family` 首尾多餘逗號，以及逗號清單中誤放的未引號 CSS 全域關鍵字會移除；宣告值誤重複屬性前綴（如 `color: color: #00008B`）會保留有效的後段值。`vertical-align: center` 與 `duokan-middle-line` 改為 `middle`，無效的 `vertical-align: right` 或 `0 auto` 移除。`text-align: justify-all` 改為 `justify`，`text-align: top` 改為等效的 `vertical-align: top`，舊式 `writing-mode: vertical-tb` 改為保留直排語意的 `vertical-rl`。無單位 `font-size` 補 `px`，`font-style` 誤填尺寸改為 `font-size`，`text-orientation` 誤填 `vertical-rl`／`vertical-lr` 改為 `writing-mode`。無效的 `float: top`、`float: center`、空 `quotes`、`inline-height`、Kindle 私有 `tb-*` 屬性、含 `auto` 的 padding、超過四個值的 margin/padding、孤立長度單位與不存在的 `page-break` 屬性會刪除，效果與瀏覽器忽略該宣告一致。六位色碼缺少 `#` 時會補上；五位且各位相同的十六進位色碼會補成六位。明確的 `line-hegiht`／`hight`／`cssword-break`／`white-spack` 拼字錯誤分別改為 `line-height`／`height`／`word-break`／`white-space`，誤把完整邊框縮寫寫在 `border-style` 時改回 `border`。

`text-align: top`／`bottom` 誤用於垂直對齊時，會改為等效的 `vertical-align: top`／`bottom`。

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
- 修復時將可驗證的單一色碼值內全形十六進位字母正規化，例如 `#dＣＤＣＤc` -> `#dCDCDc`；保留選擇器、字串與 URL 片段，掃描仍會回報原始無效色碼。
- CSS 規則區塊開頭多餘的空宣告分號，例如 `{;color: ...}` -> `{color: ...}`

## 使用方式

- 已知頂層 `style_inside;` 匯出占位會清除，包含連續重複的情況；未知破損仍回報，不刪除同名正常樣式或字串。
- XHTML `<style>` 的 XML 實體（如 `&gt;`）按 XML 文字解碼後驗證，修復輸出會重新跳脫；不解碼 HTML raw-text 或 CDATA，正文不變。
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
- 單邊 `border-*-width` 誤含 `dashed`、`dotted`、`solid` 或 `double` 樣式與長度時，改為對應的 `border-*` 縮寫，保留線條樣式與寬度。
- `/* [InDesign專用：…] */`（也支援 `【…】`）之後連續的 CSS 規則會清除，直到下一個註記；未標記的同名選擇器保留，避免刪除正文仍需的樣式。
- `padding: left:10px` 一類誤拆的方向和值會改為對應的 `padding-left: 10px`。
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

- 已知 Word 私有 `punctuation-wrap`、`mso-bidi-font-family` 及 `mso-hansi/ascii/fareast-font-family/theme-font` 會清除；標準字型宣告與其他未知 `mso-*` 保留，不以字型名稱全域取代。

- 已確認的非標準 `layout-grid`、`text-justify-trim` 會移除；舊系統文字色 `color:WindowText` 依 [CSS Color 對應表](https://www.w3.org/TR/css-color-4/#deprecated-system-colors) 改成 `CanvasText`，保留系統配色與優先權，不猜測其他未知屬性。

- 行內宣告使用 CSS 解析器辨識邊界，不依分號拆開字串、自訂值或 data URL；無法解析的原值保留給驗證報告。

- `font-style:"bold"` 等已確認的誤置合法字重，與無引號字重共用修復至 `font-weight`；未知字串不猜測。
- 已證實無效的 `text-decoration:undererline` 會移除，不猜測替代裝飾。
- 邊框縮寫及寬度的直接百分比（例如 `border:0%`）為無效值，會移除宣告而不猜測替代單位；合法百分比圓角與動態值保留。
- v0.1.1 只做保守修復，不會自動刪除所有 CSS lexer 覺得可疑的宣告。
- CSS 語法完全壞掉時會回報 parse error，仍會嘗試做安全的 regex fallback 修復。
- EPUB 打包會重新輸出 zip；`mimetype` 會以未壓縮方式寫入。

## 驗證

```powershell
node --test
```
