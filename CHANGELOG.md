# Change Log

## 0.1.0 - 2026-08-15

- 建立獨立 `epubCssFixer` 專案。
- 新增 `check` / `fix` / `scan-epub` / `fix-epub` CLI。
- 使用 `css-tree` 做 CSS parse 與 property/value 檢查。
- 使用 `jszip` 讀寫 EPUB。
- 新增安全清理規則：移除 `text-spacing-trim`、`text-combine-horizontal: all`、`text-combine: horizontal`、`duokan-text-indent`、`direction`、遠端/本機 `url(...)`、遠端/本機 `@import` 與 `@font-face`。
