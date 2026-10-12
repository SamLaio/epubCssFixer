# Change Log

## 0.1.7 - 2026-10-13

### 修正紀錄 - 2026-10-12

- 補上 CSS Text 4 的 `hyphenate-limit-lines`、`hyphenate-limit-zone`、`hyphenate-limit-last` 值驗證，保留合法設定、全域值與動態值；非法值及未知屬性仍回報，補樣式表／行內與負例回歸。

### 修正紀錄 - 2026-10-11

- 清除實檔確認的 Word 私有 `punctuation-wrap`、`mso-bidi-font-family` 及 `mso-hansi/ascii/fareast-font-family/theme-font`；保留標準 `font-family`、自訂值與字串，不泛化刪除未知 `mso-*`，補樣式表／行內及冪等回歸。

- 清除已確認的私有 `layout-grid` 與 `text-justify-trim` 宣告；`color:WindowText` 依 CSS Color 標準對應為 `CanvasText`，不固定成黑色，保留閱讀器配色與優先權。自訂屬性、字串、動態色及未知屬性不猜修，補樣式表／行內與冪等回歸。

- 行內宣告改以既有 CSS 解析器辨識完整邊界，避免依分號拆開 `content` 字串、自訂值與 data URL；無法解析時保留原值交驗證，補完整內容及冪等測試。

- 只移除無效的 `text-justify:inter-ideogrph` 拼字，維持閱讀器忽略宣告的級聯結果，不猜改為其他對齊；保留合法 `inter-character`、字串與自訂值，補樣式表／行內及冪等回歸。

- 修正邏輯間距 `margin/padding-block/inline` 可合法接受兩個值，避免誤刪合法級聯；start/end 等單邊仍只接受單值。

- 移除 `margin-block:6rem 3.rem` 這類小數點後漏數字的非法尺寸整條宣告，不猜原數值；保留合法級聯、小數、自訂屬性與字串，補樣式表／行內與冪等回歸。

- 只清除未加前綴的非法 `text-stroke`／`text-stroke-width`／`text-stroke-color`，不擅自改成有視覺效果的宣告；保留 WHATWG 定義的 `-webkit-` 描邊、自訂屬性與字串，補樣式表／行內及冪等回歸。

- 移除一般宣告的非法 `font-weight:auto`，維持閱讀器原本忽略無效值的級聯，不猜字重；保留 `@font-face` 中合法的同名描述符、動態值、字串及自訂屬性，補樣式表／行內與冪等回歸。

### 修正紀錄 - 2026-10-10

- 清除已知 Adobe 私有 `adobe-hyphenate`；有效 `valign` 改為標準 `vertical-align`，邊框縮寫誤混全域關鍵字時移除無效宣告。保留標準斷字、合法級聯、單獨全域值、字串與自訂屬性，補樣式表／行內及冪等回歸。

- 移除 `clear` 誤用的十六進位色碼宣告（如 `clear:#666`），效果同閱讀器忽略無效宣告，不猜改成 `color`；保留合法級聯、動態值、字串與自訂屬性，補共用樣式表／行內及冪等回歸。

- 僅清除已核實的孤立 `background-` 換行殘留，保留後接且通過驗證的 `border-radius` 宣告；不猜背景、不改字串、自訂值或未知拼接，補樣式表／行內、優先權、安全邊界及冪等回歸。

- 已核實的字型屬性漏字 `ont-family` 修為 `font-family`；外部、內嵌與行內 CSS 共用規則，保留字串、自訂屬性、字型順序及優先權，修正後仍驗證值。補大小寫、安全邊界與冪等回歸。

- 移除 `text-align` 單一數字、長度或百分比的無效宣告，不猜成縮排；保留合法級聯、`text-indent`、動態及自訂值，補樣式表／行內及冪等回歸。

- 移除 `font-size` 多個數字／長度／百分比構成的無效宣告，不猜字級；保留合法單值、動態函式、其他屬性與自訂值，補共用宣告與冪等回歸。

- 移除 `font-family` 單一裸數字無效宣告（如 `500`），效果同瀏覽器忽略；保留合法引號字型名、fallback、字重與自訂屬性，補外部／行內及冪等回歸。

- 已知拼字修復補入 `margin-botom` → `margin-bottom`；沿用共用宣告規則，保留字串、自訂屬性、優先權，補樣式表／行內、安全邊界及冪等測試。

- 已知尺寸屬性拼字修復補入 `heigth` → `height`，沿用樣式表與行內宣告共用規則；保留優先權、自訂屬性及字串，修正後的未知值仍回報，不猜尺寸。補樣式表／行內、大小寫及冪等回歸。

### 修正紀錄 - 2026-10-09

- 僅將 `line-height` 的單一逗號小數常值（例如 `1,5em`）改為可驗證的點號小數；保留優先權、字串、自訂值、動態值與無法驗證的多段逗號值，補樣式表／行內與冪等測試。

- 移除非法字重常值 `thin`，不猜測數字字重；保留先前合法字重、同名字型與自訂屬性，新增樣式表／行內及冪等回歸。

- 移除寬高與最小／最大尺寸的直接負值，不猜測為零；保留合法級聯、負邊距、動態函式與自訂屬性。將既有非標準 `vertical-align:text-middle` 正規化為 `middle`，保留優先權；新增樣式表／行內及冪等回歸。

- 誤放在 `font-style` 的合法字重支援成對引號（例如 `"bold"`），沿用字重改欄與驗證後解引號，保留優先權、字串與自訂值；新增樣式表／行內及冪等測試。
- 移除無效 `text-decoration:undererline`，保留合法級聯與自訂值，不猜測原意；補樣式表／行內及冪等測試。
- 移除邊框縮寫及各方向邊框寬度的直接百分比值，包括 `border:0%`；保留合法級聯、百分比圓角、自訂屬性與動態值，新增樣式表／行內及冪等回歸。
- 移除縮排與首選尺寸的無效 `none` 常值（`text-indent`、`height`、`width`），不猜測作者原意；保留合法級聯、其他屬性的合法 `none`、自訂屬性及動態值，新增樣式表／行內、大小寫、優先權及冪等回歸。

### 修正紀錄 - 2026-10-06

- 僅將已核實的合法字型列表中錯置於逗號前的 `!important` 移到宣告尾端，保留字型順序與優先權；無法驗證的列表、字串及自訂值不猜測修復。
- 移除邊框宣告中無參數的裸 `rgba`，不猜測顏色或透明度，保留先前合法級聯、真正的色彩函式與動態值；新增樣式表／行內與冪等回歸。

### 修正紀錄 - 2026-10-04

- 移除無效 color:both，不猜測成 clear 或其他色彩；保留先前有效色彩、合法 clear:both 及自訂屬性，補樣式表／行內及冪等回歸。

- 清除閱讀器私有 qrfullpage，保留同名 CSS 自訂屬性；修正已確認的 MS 直排宣告與舊 text-combine-horizontal 之間漏分號，只保留原 MS 宣告及後續合法直排，不猜測未知拼接。新增行內／樣式表與冪等回歸。

- 移除多個寬度構成的無效 `border` 縮寫及陰影中缺單位的非零偏移，不猜測方向或單位；保留合法 `border-width`、先前有效級聯、零與動態／色彩函式值。只清除宣告區塊中已確認的完整 Raw 殘留 `, 3;`，保留字串、自訂值與其他未知破損。新增樣式表、行內樣式與冪等回歸測試。

- 清除多看私有 `duokan-text-align` 與已證實無效的 `text-align:ennter`，保留先前合法對齊，不猜測錯字意圖；新增樣式表與行內樣式測試。

- 保留已知 WebKit 擴充 `text-align:-webkit-center` 並避免 css-tree 誤報；區塊置中與標準文字置中並非等義，不做破壞性替換。未知廠商值仍回報，新增樣式表與行內樣式測試。

- 移除已證實無效的 `font-size:normal`，不猜測為 `medium` 或其他字級；保留先前合法級聯、動態值及其他屬性的合法 `normal`，新增樣式表／行內樣式與冪等回歸測試。

- 修正明確的 `paddin-bottom` → `padding-bottom`、`font-color` → `color` 與 `font-weight:regular` → `normal`，保留值與 `!important`；樣式表及行內樣式共用，新增驗證與冪等測試。

- 頂層 `style_inside;` 占位文字支援匯出器連續重複的區塊，及被解析器併入有效規則前方的占位序列；只移除已知占位，保留正常選擇器、字串與未知破損。
- XHTML `<style>` 的 XML 實體先解碼再做 CSS 檢查／修復，輸出重新跳脫 XML，避免合法的 `div&gt;p` 被誤報；HTML raw-text 與 CDATA 保持原義。補上 EPUB 回歸測試。
- CSS 掃描與修復略過空的自閉 `<style/>`，保留原標籤；避免 Kobo 空樣式誤吞下一個 `<style>` 及誤報選擇器錯誤。新增 EPUB 包裝回歸測試。

### 修正紀錄 - 2026-10-03

- 依 CSS Fonts 規範移除超出 1–1000 的單一字重常值（如 `font-weight:1200`），不猜測原字重；保留合法小數、動態值及既有有效 fallback，樣式表與行內樣式共用並加入回歸測試。

- CSS 解析器自動恢復的語法錯誤也列入結果，不再將 Raw 殘留誤報為零問題。只清除已確認的頂層 `style_inside;` 匯出器占位文字，保留同名合法選擇器及字串；未知殘留仍報錯而不猜測刪除，加入回歸與冪等測試。

### 修正紀錄 - 2026-10-02

- 行內樣式以完整宣告解析 `!important`，避免合法優先權後綴誤報為值語法錯誤；保留優先權，無效值與高風險宣告仍回報。加入回歸測試。

- 移除邊框縮寫／寬度中無單位的非零常值，不猜測原始尺寸；保留零值、合法單位、色彩函式與動態值。樣式表與行內樣式共用，加入回歸及冪等測試。

### 修正紀錄 - 2026-10-01

- 移除已知私有 `qrbleed`／`zybleed` 及方向列表形式的無效 `bleed`，保留並正確驗證 `@page` 的合法 `bleed` 描述子。修正 `heigh` 為 `height`，移除直接百分比尺寸或缺第二個偏移長度的無效 `box-shadow`；保留合法陰影、色彩函式內百分比與動態值。樣式表及行內樣式共用並加入回歸測試。

- 修復空宣告值或缺漏分號造成下一個 CSS 宣告被吞入的情形；僅在拆分後每個標準屬性與值都能通過 lexer 驗證時套用，保留含冒號的字串，樣式表與 inline style 共用並加入回歸測試。

## 0.1.6 - 2026-09-30

- 清除圖片所示 `InDesign專用` 註記區段中的連續 CSS 規則，包含預設框架、註腳分隔線與註腳編號樣式；遇到下一個註記即重新判斷，其他樣式不受影響。

## 0.1.5 - 2026-09-30

- CLI 版本直接讀取 `package.json`，修正 `--version` 長期顯示舊版號的問題。

- 修復可驗證的單一 CSS 色碼值內全形十六進位字母，例如 `#dＣＤＣＤc` 改為 `#dCDCDc`；樣式表與 XHTML inline style 共用此規則。保留選擇器、字串與 URL 片段，掃描正確回報原始錯誤。
- 修正單邊 `border-*-width` 誤含線條樣式及長度（如 `border-bottom-width: dashed 2px`）：改用對應的 `border-*` 縮寫，保留原本線條語意；樣式表與 inline style 共用規則並加入回歸測試。
- 修正 `padding: left:10px` 一類將方向誤拆入值的宣告為對應單邊 padding；樣式表與 inline style 共用規則並加入回歸測試。

## 0.1.4 - 2026-09-25

- 移除 `border-radius: -1em` 一類無效的負值常數；保留 `calc()` 與 `var()` 動態值，避免猜測原始排版語意。樣式表與 XHTML inline style 共用此修復規則。

## 0.1.3 - 2026-09-25

- 將舊式 `text-justify: distribute` 改為標準 `inter-character`，保留東亞文字分散對齊語意。

- 修正相鄰通用字族遺漏逗號的 `font-family` 清單，例如 `serif sans-serif`。

- 修正常見拼寫錯誤 `margin-lft` 為 `margin-left`，並加入回歸測試。

- 正規化 CSS 函式的全形括號，例如 `rgba（...）` 改為 `rgba(...)`，避免色彩與背景值被判定不合法。

- inline `style` 也先套用 CSS 正規化，確保全形標點修復同時涵蓋樣式表與 XHTML 內嵌宣告。

- 尺寸值前誤加單一冒號時，改為對任何 CSS 屬性驗證有效後才移除，例如 `margin-bottom: : 1.25em`。

- 移除缺少必要字型家族的無效 `font` shorthand（如 `font: bold 100%`）；不猜測原字型，維持瀏覽器忽略該宣告的安全結果。

- 修正轉檔遺留的 `cssword-break: break-all` 為標準 `word-break: break-all`；樣式表與 inline style 共用規則並加入回歸測試。

- 修正 `white-spack: pre` 為標準 `white-space: pre`；樣式表與 inline style 共用規則並加入回歸測試。

- `margin`／`padding` 值含孤立長度單位（如 `0 auto 0 em`）時移除整個無效宣告；不猜測遺失數值，與閱讀器忽略該宣告的結果一致，並加入回歸測試。

- 將誤寫在 `text-align` 的 `top`／`bottom` 改為等效的 `vertical-align`，保留既有垂直對齊意圖並通過 CSS 驗證。

- `margin`／`padding` shorthand 含超過四個常值時，移除整個無效宣告；CSS 無法可靠推斷第五個值的原始語意，保留等同瀏覽器忽略該宣告的行為。樣式表與 inline style 共用規則，加入回歸測試。

- `font-family` 清單誤混入未引號的 `inherit`、`initial`、`unset`、`revert` 或 `revert-layer` 時，移除該無效清單項目並保留其他字型；單獨使用的全域值與引號內同名字型不變。加入回歸測試。

- CSS 值誤重複目前屬性前綴時，驗證後保留有效後段值，例如 `color: color: #00008B` 改為 `color: #00008B`；無法驗證時維持原值交由報告處理。加入回歸測試。

## 0.1.2 - 2026-09-23

- 將誤填於 `font-variant-east-asian` 的 OpenType `salt` 特徵改為 `font-feature-settings: "salt" 1`；補上字型名稱與緊接通用字族間遺漏的逗號，並移除無效的百分比 `border-width`。樣式表與行內樣式共用修復，避免 EPUB CSS 驗證殘留錯誤。

- 修復轉檔殘留的 `font-family: ,serif` 前導逗號；僅在移除逗號後可通過 CSS 值驗證時套用，避免 `fix-epub` 修復後仍回傳未通過的 CSS 問題；加入回歸測試。

- 移除 CSS 規則區塊開頭多餘的空宣告分號（例如 `.logo-top{;background-color:...}`），避免 CSS 解析器與 EPUBCheck 的 `CSS-008`；加入回歸測試。

- 將誤放在 `text-decoration` 的 `filled-sesame` 改為標準的 `text-emphasis-style: filled sesame`，保留文字著重點並通過 CSS 驗證；樣式表與行內樣式共用此修復。

- 修正遺漏開頭連字號的 `webkit-text-emphasis` 為 `-webkit-text-emphasis`，保留原有文字強調效果並避免 CSS 驗證失敗。
- 正規化 CSS 色碼誤用的全形井號（`＃1E90FF` -> `#1E90FF`），樣式表與行內樣式共用此修復，避免被 CSS 驗證器判為無效色碼。
- 將 `mini-height` 修正為 `min-height`，並移除誤放進 CSS 的 HTML 表格屬性 `colspan`。

- 修復 `dispaly: block` 這類常見的 `display` 拼字錯誤，並加入樣式表與行內樣式回歸測試。
- 將 `font-style: bold` 等誤放的字重值修為 `font-weight`，並加入樣式表與行內樣式回歸測試。

- 將無單位的非零 `text-indent` 補為 `em`；移除無效的 `*-color: 0`；五位十六進位色碼補上最後一碼（例如 `#56656` -> `#566566`），並加入樣式表與行內樣式回歸測試。

- 修復尺寸值前誤加的單一冒號（例如 `width: :5em`）；僅在移除後可通過 CSS 值驗證時套用。將 `background-position`／`background-repeat: initial initial` 收斂為合法的單一 `initial`，並加入樣式表與行內樣式回歸測試。

- 修復無單位 `font-size`、`font-style` 誤放尺寸、`hight`、`transpatrnt`、`text-align: lift` 與 `vertical-align: text-baseline`；`text-align: top` 改為保留頂端對齊意圖的 `vertical-align: top`；把誤填到 `text-orientation` 的 `vertical-rl`／`vertical-lr` 改為等效的 `writing-mode`。
- 移除 Kindle 私有 `tb-*` CSS 屬性，並加入樣式表與行內樣式的回歸測試。

- 移除被誤寫進 CSS 的 HTML 表格屬性 `cellspacing`、`cellpadding`，以及無效的 `max-height: auto`／`max-width: auto`；保留合法的尺寸宣告，並加入回歸測試。

- 移除私有 `oeb-column-number`，修正 `font-weight: blod` 為 `bold`；舊式 EPUB 的非零純數值 `width`／`height` 視為像素尺寸補上 `px`，保留零值不變。樣式表與行內樣式共用規則，並加入回歸測試。

- 將無效 `text-align: justify-all` 修為 `justify`，舊式 `writing-mode: vertical-tb` 修為 `vertical-rl` 以保留直排；移除無效 `vertical-align: 0 auto`。樣式表與行內樣式共用規則，並加入回歸測試。

- 修復六位色碼缺少 `#`、空 `quotes`、`widows`／`orphans: auto`、`line-hegiht` 拼字錯誤及誤放在 `border-style` 的完整邊框縮寫；移除無效的 `inline-height` 與 `vertical-align: right`。

- 移除 `duokan-bleed`、非法 `float: center`、含 `auto` 的 padding、多值長邊距及帶小數長度的 `widows`／`orphans`；將 `vertical-align: duokan-middle-line` 改為 `middle`，並修復各位相同的五位十六進位色碼。

- 修復 `widows`／`orphans` 正整數誤加長度單位、`font-family` 尾端多餘逗號及 `vertical-align: center`；移除無效 `float: top` 與不存在的 `page-break` 屬性，並加入樣式表與行內樣式回歸測試。

- 舊式 `text-justify: inter-ideograph` 改用現行 `inter-character`；`writing-mode: horizontal` 修為 `horizontal-tb`，保留既有直排。移除負數常值 padding 及非零但缺單位的 margin/padding 宣告，不猜單位、不改成 margin、不刪先前合法宣告；保留負 margin、`calc()` 與 `var()`。樣式表及行內樣式共用規則並加入回歸測試。

- 正確區分 `@page size` 描述子與普通選擇器中誤植的 `size`；EPUB 報告補上 `changed`、`fixedIssues`。

- 共用樣式表與行內樣式的已知錯值修復：置中、字距、誤引號、舊式文字方向、JS 尺寸殘值與空色碼。
- 保留合法字串與自訂變數；不把 css-tree 無法計算 `var()` 誤報成非法值，也不刪除未知新語法。
- 尚有錯誤時 CLI 回傳結束碼 2，避免呼叫端僅因命令正常執行就誤判 CSS 已通過。新增回歸測試。

## 0.1.1 - 2026-08-15

- 修正 `fix-epub` 重寫 XHTML inline style 時未 escape 屬性值的問題；
  若 inline style 內含 HTML/XML entity 片段，會移除該單一 CSS 宣告，避免
  `&#34;` 這類內容被切成缺分號 entity 而造成 EPUBCheck `RSC-016`。
- 修正 CSS 檢查時將 `@font-face` 內合法的 `src` descriptor 誤判為未知 property 的問題，改用 at-rule descriptor 規則驗證。
- 修正 `@page` 內 `margin-top`、`margin-bottom` 等頁面邊界宣告被誤當成 at-rule descriptor 的問題。

## 0.1.0 - 2026-08-15

- 建立獨立 `epubCssFixer` 專案。
- 新增 `check` / `fix` / `scan-epub` / `fix-epub` CLI。
- 使用 `css-tree` 做 CSS parse 與 property/value 檢查。
- 使用 `jszip` 讀寫 EPUB。
- 新增安全清理規則：移除 `text-spacing-trim`、`text-combine-horizontal: all`、`text-combine: horizontal`、`duokan-text-indent`、`direction`、遠端/本機 `url(...)`、遠端/本機 `@import` 與 `@font-face`。
