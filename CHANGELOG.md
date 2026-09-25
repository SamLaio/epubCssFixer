# Change Log

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
