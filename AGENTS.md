# epubCssFixer Agent Rules

本檔是 `epubCssFixer` 的 agent / Codex 專案慣例檔。修改、提交、推送或發版前，先依照這裡的規則檢查。

## 版本

- 目前版本：`0.1.2`
- 版本號來源：`package.json`
- README、CHANGELOG、package.json 的描述要和實際 CLI 行為一致。

## 專案定位

- 本專案是獨立 CSS 檢查與修復工具，不直接取代 `D:\project\epub223`。
- `epub223` 後續可以呼叫本工具處理 EPUB 內 CSS；本工具只處理 CSS 與 EPUB 內可定位的 CSS 片段。
- EPUB 結構、OPF、nav、NCX、XHTML 結構修復仍屬於 `D:\project\epub223`。
- TXT 轉 EPUB 仍屬於 `D:\github\ezPub`。

## 核心功能

`0.1.1` 版核心功能如下：

- `check`：檢查單一 CSS 檔。
- `fix`：修復單一 CSS 檔。
- `scan-epub`：掃描 EPUB 內 `.css`、XHTML/HTML `<style>` 與 inline `style`。
- `fix-epub`：修復 EPUB 內 `.css`、XHTML/HTML `<style>` 與 inline `style`，輸出新的 EPUB。
- 使用 `css-tree` 做 CSS parse 與 property/value 檢查。
- 使用 `jszip` 讀寫 EPUB zip。

## 修復原則

- 預設只修「可安全泛用」且已知會影響 EPUBCheck 或閱讀器相容性的 CSS。
- 不因 CSS lexer 回報不熟悉的新式語法就直接刪除，除非已列入安全 deny/fix 規則。
- 若遇到新錯誤，先分類：
  - 可泛用 CSS 修復規則。
  - 單本書特有破損。
  - 不安全泛化。
  - 需要人工內容判斷。
- 若是可泛用規則，補實作、最小測試、README 與 CHANGELOG。
- 報告與文件一律使用正體中文。

## 主要檔案

- `bin/epub-css-fixer.js`：CLI 入口。
- `src/css.js`：CSS 檢查與修復核心。
- `src/epub.js`：EPUB 掃描與修復。
- `test/`：Node 內建 test runner 測試。

## 驗證方式

- 修改程式後執行：

```powershell
node --test
```

- 若改到 EPUB 打包邏輯，至少用測試 EPUB 跑一次 `scan-epub` 與 `fix-epub`。
- 本專案不把 EPUBCheck 當執行依賴；EPUBCheck 是外部最終驗證工具。

## Git / Release 慣例

- 預設主分支：`main`。
- commit 前確認 `npm test` 或 `node --test` 通過。
- release 前確認版本號、README、CHANGELOG 一致。
- 發版 tag 使用 `v<version>`，例如 `v0.1.0`。
- 不提交 `node_modules/`、暫存 EPUB、log、coverage。

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
