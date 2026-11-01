# CSS 修復規則與限制

[回到使用說明](../README.md)

## 修復原則

檢查與修復是不同階段。解析器回報可疑值，不代表可以自動刪除；只套用已核實且有回歸測試的規則。保留合法級聯、自訂屬性、字串與動態函式，不猜未知值的作者原意。完整逐版變動見 CHANGELOG，這裡按使用者遇到的問題分類。

## 常見修復類型

| 類型 | 代表例 | 處理方式 |
| --- | --- | --- |
| 明確拼字錯誤 | `dispaly`、`margin-botom`、`ont-family`、`heigth` | 改為已確認的標準屬性，修正後仍驗證值 |
| 字元與語法殘留 | 全形百分號／冒號、頂層 `style_inside;`、可確認的漏分號 | 僅處理可驗證的宣告，不拆字串或 URL |
| 屬性誤置 | `font-style:bold`、`font-color`、邊框縮寫放進 `border-style` | 已知對應才移至正確屬性 |
| 舊式語法 | `text-justify:inter-ideograph`、`vertical-align:center` | 分別轉為已知相容寫法 `inter-character`、`middle` |
| 明確無效值 | `text-align:cener`、`font-stretch:ultra-narrower`、`font-size:normal` | 移除無效宣告，保留先前合法級聯，不猜替代值 |
| 不合法尺寸 | 直接負寬高、負 padding、`margin-block:3.rem`、多值 `font-size` | 僅移除已證實無效的宣告；合法負 margin、calc／var 保留 |
| 色碼與優先權 | 可驗證的 `#black`、已知破損色碼、字型列表 misplaced `!important` | 只在能確認合法結果時修復 |
| 私有與匯出殘留 | 已知 Word `mso-*`、多看、Adobe、`qrfullpage` 等 | 僅清除明列規則；未知 mso 屬性不一律刪除 |

## 外部資源與排版清理

修復會清除規則明列的非標準宣告，例如 `text-spacing-trim`、舊 `text-combine-horizontal:all`、`text-combine:horizontal`、`duokan-text-indent`、`duokan-bleed`、`oeb-column-number`、`direction`，以及含 `file:`、`res:/`、遠端 HTTP(S) 的 URL 與相關外部 `@import`／`@font-face`。

因此修復後可能改變字型或方向設定。需要特殊排版的書應先檢查工作副本，不直接批次替換原書。合法 WebKit 擴充、現代斷字設定及動態值不會只因語法資料庫不熟悉就全部刪除。

## HTML／XHTML 安全邊界

行內宣告使用 CSS 語法解析邊界，避免按分號切壞 data URL 或字串。XHTML style 內 XML 實體解碼後檢查，寫回時重新跳脫；HTML raw-text 與 CDATA 不套同一解碼。空自閉 style 不吞入下一區塊，正文可見文字保持。

## 無法自動解決的問題

未知拼接、嚴重 parse error、缺字型／缺圖片或無法判斷的排版意圖，可能修復後仍有問題。工具會嘗試已知安全的 fallback，但不保證完全修復。`var()` 的執行時計算不在靜態驗證範圍；EPUB 重新打包時 `mimetype` 以未壓縮方式寫入。

規範依據包括 [CSS Text](https://www.w3.org/TR/css-text-3/)、[CSS Fonts](https://www.w3.org/TR/css-fonts-4/)、[CSS Writing Modes](https://www.w3.org/TR/css-writing-modes-3/)、[CSS Backgrounds](https://www.w3.org/TR/css-backgrounds-3/) 與 [CSS Color](https://www.w3.org/TR/css-color-4/)。
