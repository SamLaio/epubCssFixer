# epubCssFixer 0.1.0

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
- `direction`
- 含 `file:`、`res:/`、遠端 `http(s)://` 的 `url(...)`
- 遠端或本機資源的 `@import`
- 遠端或本機資源的 `@font-face`

同時會正規化：

- 全形百分比 `％` -> `%`
- 全形冒號 `：` -> `:`

## 使用方式

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

- v0.1.0 只做保守修復，不會自動刪除所有 CSS lexer 覺得可疑的宣告。
- CSS 語法完全壞掉時會回報 parse error，仍會嘗試做安全的 regex fallback 修復。
- EPUB 打包會重新輸出 zip；`mimetype` 會以未壓縮方式寫入。

## 驗證

```powershell
node --test
```
