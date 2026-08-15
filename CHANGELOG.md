# Change Log

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
