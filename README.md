# epubCssFixer

檢查及修復 CSS 的命令列工具。可處理單一 CSS 檔，也可掃描 EPUB 內的樣式表、HTML／XHTML `<style>` 區塊與行內 `style`，將可安全處理的問題修復後輸出新檔。

適合在 EPUB 結構修復後檢查樣式，並提供 JSON 給批次流程判讀。OPF、目錄與 XHTML 結構修復請用 epub223。

目前版本：**0.1.9**。版本異動見 [CHANGELOG](CHANGELOG.md)。

## 安裝與快速開始

需要 Node.js 20 以上。在專案根目錄安裝相依套件並掃描 EPUB：

```powershell
pnpm install
node .\bin\epub-css-fixer.js scan-epub .\book.epub --json
```

若有可修復問題，輸出新的 EPUB：

```powershell
node .\bin\epub-css-fixer.js fix-epub .\book.epub -o .\book.fixed.epub --json
```

保留原檔，輸出路徑請與輸入分開。修復後重新掃描，並用外部 EPUBCheck 檢查整本書。

## 四個操作

| 指令 | 輸入 | 行為 |
| --- | --- | --- |
| `check` | CSS | 檢查，不輸出修復檔 |
| `fix` | CSS | 修復，`-o` 指定輸出 |
| `scan-epub` | EPUB | 掃描，不修改原書 |
| `fix-epub` | EPUB | 修復 CSS，`-o` 指定新 EPUB |

```powershell
node .\bin\epub-css-fixer.js check .\style.css --json
node .\bin\epub-css-fixer.js fix .\style.css -o .\style.fixed.css --json
node .\bin\epub-css-fixer.js --version
```

`--json` 提供機器可讀結果；省略時顯示文字報告。`--help` 顯示指令摘要。

## 如何判讀修復結果

有輸出檔不代表全部問題已修好。EPUB 批次流程應同時要求：

- 程序結束碼為 `0`。
- JSON 可解析且 `ok: true`。
- `totalIssues = 0`。

`changed` 表示是否改動，`fixedIssues` 表示已修數量，都不能代替剩餘問題數。結束碼 `2` 或 `ok: false` 表示仍有問題，需閱讀問題清單；其他執行錯誤也不能視為通過。

## 檢查與修復的範圍

掃描涵蓋 `.css`、可確認為 UTF-8 CSS 的無副檔名檔案、內嵌及行內樣式。未知文字或二進位資源不猜成 CSS。行內樣式只讀取真正標籤的屬性，不把跳脫 HTML 範例、註解或程式字串當成樣式。

使用 css-tree 解析與驗證；修復採已知規則，未知錯誤會留在報告。外部字型與 URL 清理可能改變外觀，採用前應確認字型與排版。分類與代表性規則見 [修復規則與限制](docs/rules.md)。

## 建議處理順序

1. epub223 轉換／修復 EPUB 結構。
2. epubCssFixer 掃描、修復並重新掃描 CSS。
3. 外部 EPUBCheck 驗證整本書，再用閱讀器檢查。

EPUBCheck 不是本工具的執行依賴；CSS 掃描通過也不代表 OPF、目錄、連結或閱讀器版面正確。

## 開發與授權

測試：`node --test`（或 `npm test`）。CLI 在 `bin/epub-css-fixer.js`，CSS 核心在 `src/css.js`，EPUB 處理在 `src/epub.js`。授權 GPL-3.0-or-later，見 [LICENSE](LICENSE)。

## 第三方來源與致謝

### 實際使用的套件

| 專案／作者 | 使用範圍 | 上游授權 |
| --- | --- | --- |
| [CSSTree／Roman Dvornov](https://github.com/csstree/csstree) | CSS 語法解析、宣告與值驗證 | MIT |
| [JSZip／Stuart Knightley、David Duponchel、Franz Buchinger、António Afonso 與貢獻者](https://github.com/Stuk/jszip) | EPUB ZIP 讀寫 | MIT 或 GPL v3 雙重授權 |
| [Node.js](https://nodejs.org/) | 執行環境與內建測試工具 | Node.js 自身及所含元件依各自授權 |

套件版本見 `package.json` 與鎖定檔；轉遞相依的署名及授權保留於各套件。本專案 GPL-3.0-or-later 不取代這些原有聲明。

### 規範與相容性參考

- [W3C CSS 規範](https://www.w3.org/Style/CSS/)與 [EPUB 3.3](https://www.w3.org/TR/epub-33/)：屬性、值、文字方向與 EPUB 相容性依據。
- [WHATWG Compatibility Standard](https://compat.spec.whatwg.org/)：WebKit 描邊等相容語法參考。
- [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS)：瀏覽器擴充與非標準語法的行為參考。

以上是規範／文件參考，不是複製第三方修復器的程式碼；各類修復例子與規範連結集中於 [修復規則](docs/rules.md)。
