import * as csstree from "css-tree";

const DENIED_PROPERTIES = new Set(["cellpadding", "cellspacing", "colspan", "direction", "duokan-bleed", "duokan-text-indent", "layout-grid", "oeb-column-number", "page-break", "text-justify-trim", "text-spacing-trim", "qrbleed", "qrfullpage", "zybleed"]);
const DENIED_PROPERTY_VALUES = new Map([
  ["text-combine-horizontal", /^all$/i],
  ["text-combine", /^horizontal$/i],
  ["bleed", /^(?:left|top|right|bottom)(?:\s+(?:left|top|right|bottom))*(?:\s*!important)?$/i],
]);
const UNSAFE_URL_RE = /url\(\s*(['"]?)(?:https?:\/\/|file:|res:\/)[^)]+\1\s*\)/i;
const UNSAFE_IMPORT_RE = /@import\s+(?:url\(\s*(['"]?)(?:https?:\/\/|file:|res:\/)[^)]+\1\s*\)|(['"])(?:https?:\/\/|file:|res:\/).*?\2|(?:https?:\/\/|file:|res:\/)[^;]+)[^;]*;/gi;
const ENTITY_FRAGMENT_RE = /&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]+);?/i;
// css-tree 尚未收錄的 CSS Text 4 屬性仍須驗證值，不豁免未知宣告。
const TEXT4_SYNTAX = {
  "hyphenate-limit-lines": "no-limit | <integer [0,∞]>",
  "hyphenate-limit-zone": "<length-percentage>",
  "hyphenate-limit-last": "none | always | column | page | spread",
};

function loc(node) {
  return {
    line: node?.loc?.start?.line || null,
    column: node?.loc?.start?.column || null,
  };
}

function normalizeCssText(css) {
  return css.replace(/[^\S\r\n]+/g, " ").replace(/[％＃（）]/g, char => ({ "％": "%", "＃": "#", "（": "(", "）": ")" })[char]).replace(/：/g, ":").replace(/\{\s*;+/g, "{");
}

function propertyValue(node) {
  try {
    return csstree.generate(node.value).trim();
  } catch {
    return "";
  }
}

function isDeniedDeclaration(property, value) {
  const prop = property.toLowerCase();
  if (prop === "duokan-text-align") return true;
  if (prop === "adobe-hyphenate") return true;
  if (prop === "punctuation-wrap" || /^mso-(?:bidi-font-family|(?:hansi|ascii|fareast)-(?:font-family|theme-font))$/.test(prop)) return true;
  if (["text-stroke", "text-stroke-width", "text-stroke-color"].includes(prop)) return true;
  if (DENIED_PROPERTIES.has(prop) || prop.startsWith("tb-")) return true;
  const valueRule = DENIED_PROPERTY_VALUES.get(prop);
  return Boolean(valueRule && valueRule.test(value.trim()));
}

function hasUnsafeUrl(value) {
  return UNSAFE_URL_RE.test(value);
}

function validateDeclaration(property, valueAst, atruleName = null) {
  const prop = property.toLowerCase();
  if (prop.startsWith("-") || prop.startsWith("--")) return null;
  // WebKit 的區塊置中擴充不能等同文字 center；保留已知有效擴充。
  if (prop === "text-align" && csstree.generate(valueAst).toLowerCase() === "-webkit-center") return null;
  try {
    const syntax = atruleName !== "font-face" && TEXT4_SYNTAX[prop];
    const match = syntax
      ? csstree.lexer.match(`${syntax} | inherit | initial | unset | revert | revert-layer`, valueAst)
      : atruleName === "font-face" || (atruleName === "page" && ["size", "bleed"].includes(prop))
      ? csstree.lexer.matchAtruleDescriptor(atruleName, prop, valueAst)
      : csstree.lexer.matchProperty(prop, valueAst);
    const error = match.error?.message;
    // The lexer cannot evaluate custom properties; this is not invalid CSS.
    return error?.includes("Matching for a tree with var() is not supported") ? null : error || null;
  } catch (error) {
    return error.message;
  }
}

function splitSwallowedDeclaration(property, value) {
  // !important 必須置於完整宣告尾端；只移動已核實的字型列表形式。
  if (property.toLowerCase() === "font-family" && /^(?:"[^"\\]*"|'[^'\\]*'|[\w-]+)\s*!important\s*,[^!]+$/i.test(value.trim())) {
    const family = value.replace(/\s*!important\s*/i, "");
    try {
      if (csstree.lexer.matchProperty("font-family", csstree.parse(family, { context: "value" })).matched) return [`font-family:${family}!important`];
    } catch { /* 未知字型語法仍保留並回報。 */ }
  }
  // 已確認的匯出器漏分號：保留 MS 宣告，只移除緊接的無效舊宣告。
  if (property.toLowerCase() === "-ms-text-combine-horizontal" && /^all[\r\n]+\s*text-combine-horizontal\s*:\s*all$/i.test(value.trim())) return ['-ms-text-combine-horizontal: all'];
  if (repairDeclarationProperty(property, value) !== property) return null;
  const empty = value.match(/^([\w-]+)\s*:\s*([^:]+)$/);
  const joined = value.match(/^([^\r\n:]+)[\r\n]+\s*([\w-]+)\s*:\s*([^:]+)$/);
  const parts = empty ? [[empty[1], empty[2]]] : joined ? [[property, joined[1]], [joined[2], joined[3]]] : null;
  if (!parts) return null;
  try {
    return parts.every(([prop, val]) => !prop.startsWith("-") && csstree.lexer.matchProperty(prop, csstree.parse(val, { context: "value" })).matched)
      ? parts.map(([prop, val]) => `${prop}: ${val.trim()}`) : null;
  } catch { return null; }
}

function repairDeclarationProperty(property, value, atruleName = null) {
  const prop = property.toLowerCase();
  if (prop === "valign" && /^(?:top|middle|bottom|baseline)(?:\s*!important)?$/i.test(value.trim())) return "vertical-align";
  if (prop === "font-variantion-setting") return "font-variation-settings";
  if (prop === "dispaly") return "display";
  if (prop === "ont-family") return "font-family";
  if (/^background-\s*[\r\n]+\s*border-radius$/i.test(property.trim())) {
    try {
      const radius = csstree.parse(value.replace(/\s*!important\s*$/i, ""), { context: "value" });
      if (csstree.lexer.matchProperty("border-radius", radius).matched) return "border-radius";
    } catch { /* 未知拼接保留回報，不猜背景值。 */ }
  }
  if (prop === "line-hegiht") return "line-height";
  if (prop === "hight" || prop === "heigh" || prop === "heigth") return "height";
  if (prop === "margin-lft") return "margin-left";
  if (prop === "margin-botom") return "margin-bottom";
  if (prop === "paddin-bottom") return "padding-bottom";
  if (prop === "font-color") return "color";
  if (prop === "cssword-break") return "word-break";
  if (prop === "white-spack") return "white-space";
  if (prop === "mini-height") return "min-height";
  if (prop === "webkit-text-emphasis") return "-webkit-text-emphasis";
  if (prop === "text-decoration" && /^filled-sesame(?:\s*!important)?$/i.test(value.trim())) return "text-emphasis-style";
  if (prop === "font-style" && /^(?:bold|bolder|lighter|[1-9]00)$/i.test(value.trim().replace(/\s*!important\s*$/i, "").replace(/^(['"])(.*)\1$/, "$2"))) return "font-weight";
  if (prop === "font-style" && /^\d+(?:\.\d+)?(?:px|em|rem|%|pt)$/i.test(value.trim().replace(/\s*!important\s*$/i, ""))) return "font-size";
  if (prop === "text-orientation" && /^vertical-(?:rl|lr)$/i.test(value.trim().replace(/\s*!important\s*$/i, ""))) return "writing-mode";
  if (prop === "text-align" && /^top$/i.test(value.trim().replace(/\s*!important\s*$/i, ""))) return "vertical-align";
  if (prop === "text-align" && /^bottom$/i.test(value.trim().replace(/\s*!important\s*$/i, ""))) return "vertical-align";
  if (prop === "font-variant-east-asian" && /^salt(?:\s*!important)?$/i.test(value.trim())) return "font-feature-settings";
  if (prop === "padding" && /^(top|right|bottom|left)\s*:/i.test(value.trim())) return `padding-${value.trim().match(/^(top|right|bottom|left)\s*:/i)[1].toLowerCase()}`;
  if (prop === "border-style") {
    try {
      const ast = csstree.parse(value, { context: "value" });
      if (validateDeclaration(prop, ast, atruleName) && !validateDeclaration("border", ast, atruleName)) return "border";
    } catch { /* Keep malformed declarations for the validation report. */ }
  }
  if (/^border-(?:top|right|bottom|left)-width$/.test(prop) && /^(?:dashed|dotted|solid|double)\s+\d+(?:\.\d+)?(?:px|em|rem|pt)(?:\s*!important)?$/i.test(value.trim())) {
    return prop.replace(/-width$/, "");
  }
  return property;
}

function repairDeclarationValue(property, value, atruleName = null) {
  const prop = property.toLowerCase();
  const important = value.match(/\s*!important\s*$/i)?.[0] || "";
  const raw = important ? value.slice(0, -important.length).trim() : value;
  const lower = raw.toLowerCase();
  if (prop === "color" && lower === "windowtext") return `CanvasText${important}`;
  if (prop === "text-justify" && lower === "inter-ideogrph") return null;
  if (prop === "margin-block" && /(?:^|\s)[+-]?\d+\.(?:px|em|rem|pt|%)(?=\s|$)/i.test(raw)) return null;
  if (prop === "text-align") {
    try {
      const parts = csstree.parse(raw, { context: "value" }).children.toArray();
      if (parts.length === 1 && ["Number", "Dimension", "Percentage"].includes(parts[0].type)) return null;
    } catch { /* 未知對齊值仍回報，不猜測成縮排。 */ }
  }
  if (prop === "line-height" && /^\d+,\d+(?:[a-z]+|%)?$/i.test(raw)) {
    const candidate = raw.replace(",", ".");
    if (!validateDeclaration(prop, csstree.parse(candidate, { context: "value" }), atruleName)) return candidate + important;
  }
  if (["height", "width", "min-height", "min-width", "max-height", "max-width"].includes(prop)) {
    try {
      const parts = csstree.parse(raw, { context: "value" }).children.toArray();
      // 只移除直接負尺寸；動態函式及合法負邊距不猜測。
      if (parts.length === 1 && ["Dimension", "Percentage", "Number"].includes(parts[0].type) && Number(parts[0].value) < 0) return null;
    } catch { /* 未知尺寸仍交驗證報告。 */ }
  }
  // normal 不是合法字級；移除後維持閱讀器原本忽略宣告的級聯結果。
  if (prop === "font-size" && lower === "normal") return null;
  if (prop === "font-size") {
    try {
      const parts = csstree.parse(raw, { context: "value" }).children.toArray();
      if (parts.length > 1 && parts.every(part => ["Number", "Dimension", "Percentage"].includes(part.type))) return null;
    } catch { /* 不猜未知字級，保留給驗證報告。 */ }
  }
  if (prop === "font-weight" && lower === "thin") return null;
  if (prop === "font-weight" && lower === "auto" && atruleName !== "font-face") return null;
  // none 不是縮排／首選尺寸的合法值；移除以維持原本忽略宣告的級聯。
  if (["text-indent", "height", "width"].includes(prop) && lower === "none") return null;
  if (prop === "text-align" && lower === "ennter") return null;
  if (prop === "color" && lower === "both") return null;
  // clear 不接受色碼；移除後維持閱讀器忽略無效宣告的級聯，不猜成 color。
  if (prop === "clear" && /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) return null;
  if (prop === "text-decoration" && lower === "undererline") return null;
  if (["text-shadow", "box-shadow"].includes(prop)) {
    try {
      const parts = csstree.parse(raw, { context: "value" }).children.toArray();
      if (parts.some(part => part.type === "Number" && Number(part.value) !== 0)) return null;
    } catch { /* 不猜測陰影偏移單位，未知值仍保留於報告。 */ }
  }
  if (prop === "font-weight" && /^[+-]?(?:\d*\.)?\d+(?:e[+-]?\d+)?$/i.test(raw) && (Number(raw) < 1 || Number(raw) > 1000)) return null;
  if (prop === "box-shadow") {
    try {
      const parts = csstree.parse(raw, { context: "value" }).children.toArray();
      // 只移除已證實無效的直接百分比尺寸或單一長度；不猜測動態值。
      if (parts.some(part => part.type === "Percentage") ||
          (parts.filter(part => part.type === "Dimension" || part.type === "Number").length === 1 &&
           parts.every(part => ["Dimension", "Number", "Hash"].includes(part.type)))) return null;
    } catch { /* 無法判斷的陰影保留在驗證報告。 */ }
  }
  if (/^#(?:[0-9A-Fa-fＡ-Ｆａ-ｆ]{3}|[0-9A-Fa-fＡ-Ｆａ-ｆ]{4}|[0-9A-Fa-fＡ-Ｆａ-ｆ]{6}|[0-9A-Fa-fＡ-Ｆａ-ｆ]{8})$/.test(raw)) {
    const color = raw.replace(/[Ａ-Ｆａ-ｆ]/g, char => String.fromCodePoint(char.codePointAt(0) - 0xFEE0));
    if (color !== raw && !validateDeclaration(prop, csstree.parse(color, { context: "value" }), atruleName)) return color + important;
  }
  if (property.toLowerCase() === "zy-fontsize-adjust") return null;
  if (prop === "font" && /^(?:bold|italic|small-caps)\s+\d+(?:\.\d+)?%$/i.test(raw)) return null;
  if (prop === "text-emphasis-style" && lower === "filled-sesame") return `filled sesame${important}`;
  if (prop === "font-feature-settings" && lower === "salt") return `"salt" 1${important}`;
  if (property.toLowerCase() === "font-variation-settings" && /^(?:"|')?[a-z]{4}(?:"|')?$/i.test(raw)) return `"${raw.replace(/["']/g, "")}" 1${important}`;
  const typoFixed = raw.replace(/\btranspatrnt\b/gi, "transparent");
  if (typoFixed !== raw) return typoFixed + important;
  const withoutRepeatedProperty = raw.replace(new RegExp(`^${prop}\\s*:\\s*`, "i"), "");
  if (withoutRepeatedProperty !== raw) {
    try {
      if (!validateDeclaration(prop, csstree.parse(withoutRepeatedProperty, { context: "value" }), atruleName)) return withoutRepeatedProperty + important;
    } catch { /* Keep unrepairable repeated fragments for the validation report. */ }
  }
  if (/^padding-(?:top|right|bottom|left)$/.test(prop)) {
    const candidate = raw.replace(/^(?:top|right|bottom|left)\s*:\s*/i, "");
    if (candidate !== raw) return candidate + important;
  }
  if (["widows", "orphans"].includes(prop) && lower === "auto") return null;
  if (["max-height", "max-width"].includes(prop) && lower === "auto") return null;
  if (["widows", "orphans"].includes(prop) && /^\d+(?:\.\d+)?[a-z]+$/i.test(raw)) {
    const count = raw.match(/^\d+(?:\.\d+)?/)[0];
    return Number.isInteger(Number(count)) && Number(count) > 0 ? count + important : null;
  }
  if (prop === "font-family") {
    if (/^[+-]?\d+(?:\.\d+)?$/.test(raw)) return null;
    const candidate = raw
      .replace(/^\s*,\s*/, "")
      .replace(/(?:^|,)\s*(?:inherit|initial|unset|revert(?:-layer)?)\s*(?=,|$)/gi, "")
      .replace(/(["'])(?=(?:serif|sans-serif|monospace|cursive|fantasy|system-ui)\b)/gi, "$1,")
      .replace(/\b(serif|sans-serif|monospace|cursive|fantasy|system-ui)\s+(?=(?:serif|sans-serif|monospace|cursive|fantasy|system-ui)\b)/gi, "$1,")
      .replace(/^\s*,\s*|\s*,\s*$/g, "")
      .replace(/,+$/, "");
    if (candidate !== raw) {
      try {
        if (!validateDeclaration(prop, csstree.parse(candidate, { context: "value" }), atruleName)) return candidate + important;
      } catch { /* Keep malformed family lists for the validation report. */ }
    }
  }
  if (prop === "border-width" && /(?:^|\s)\d+(?:\.\d+)?%(?:\s|$)/.test(raw)) return null;
  if (/^border(?:-(?:top|right|bottom|left))?(?:-width)?$/.test(prop)) {
    try {
      const parts = csstree.parse(raw, { context: "value" }).children.toArray();
      // 邊框寬度不接受百分比；不猜測百分比應改成哪種長度。
      if (parts.length > 1 && parts.some(part => part.type === "Identifier" && /^(?:initial|inherit|unset|revert|revert-layer)$/i.test(part.name))) return null;
      if (parts.some(part => part.type === "Percentage")) return null;
      if (parts.some(part => part.type === "Number" && Number(part.value) !== 0)) return null;
      // 裸 rgba 並非顏色；移除無效宣告，不補猜色碼或透明度。
      if (parts.some(part => part.type === "Identifier" && part.name.toLowerCase() === "rgba")) return null;
      // border 縮寫只有一個寬度；不猜測多長度原意為 border-width。
      if (!prop.endsWith("-width") && parts.length > 1 &&
          parts.every(part => ["Number", "Dimension"].includes(part.type))) return null;
    } catch { /* 不猜測邊框單位，無法辨識的值留在報告。 */ }
  }
  if (prop === "border-radius") {
    try {
      const parts = csstree.parse(raw, { context: "value" }).children.toArray();
      if (parts.some(part => ["Number", "Dimension", "Percentage"].includes(part.type) && Number(part.value) < 0)) return null;
    } catch { /* Keep dynamic or malformed values for the validation report. */ }
  }
  if (prop === "quotes" && /^(?:""|'')(?:\s*,\s*(?:""|''))*$/.test(raw)) return null;
  if (prop === "float" && ["top", "center"].includes(lower)) return null;
  if (prop === "inline-height" || (prop === "vertical-align" && ["right", "0 auto"].includes(lower))) return null;
  const spacing = /^(margin|padding)(?:-(?:top|right|bottom|left|block|inline)(?:-start|-end)?)?$/.exec(prop);
  if (spacing) {
    // Remove invalid literals, preserving earlier cascade fallbacks and calc()/var().
    try {
      const parts = csstree.parse(raw, { context: "value" }).children.toArray();
      const maxParts = prop === spacing[1] ? 4 : /-(?:block|inline)$/.test(prop) ? 2 : 1;
      if (parts.length > maxParts) return null;
      if (parts.some(part => part.type === "Identifier" && /^(?:em|rem|px|pt|pc|cm|mm|in|vh|vw|vmin|vmax)$/i.test(part.name))) return null;
      if (spacing[1] === "padding" && parts.some(part => part.type === "Identifier" && part.name.toLowerCase() === "auto")) return null;
      if (parts.every(part => ["Number", "Dimension", "Percentage"].includes(part.type) ||
          (part.type === "Identifier" && part.name.toLowerCase() === "auto")) &&
          parts.some(part => (spacing[1] === "padding" && Number(part.value) < 0) ||
            (part.type === "Number" && Number(part.value) !== 0))) return null;
    } catch { /* Leave malformed or dynamic spacing for the validation report. */ }
  }
  if (prop === "size" && atruleName !== "page") return null;
  if ((["height", "width"].includes(prop) && /^(clientheight|clientwidth)$/.test(lower)) ||
      (prop.endsWith("-color") && raw === "0") ||
      (["color", "background-color", "border-color"].includes(prop) && /^(["'])?#\1$/.test(raw))) return null;
  if (["color", "background-color", "border-color"].includes(prop) && /^#([0-9a-f])\1{4}$/i.test(raw)) {
    return `${raw}${raw.at(-1)}${important}`;
  }
  if ((prop === "color" || prop.endsWith("-color")) && /^#[0-9a-f]{5}$/i.test(raw)) {
    return `${raw}${raw.at(-1)}${important}`;
  }
  if (["color", "background-color", "border-color"].includes(prop) && /^[0-9a-f]{6}$/i.test(raw)) {
    return `#${raw}${important}`;
  }
  if (/^:\s*\d+(?:\.\d+)?(?:px|em|rem|%|pt|vh|vw)$/i.test(raw)) {
    const candidate = raw.replace(/^:\s*/, "");
    try {
      if (!validateDeclaration(prop, csstree.parse(candidate, { context: "value" }), atruleName)) return candidate + important;
    } catch { /* Keep unknown malformed dimensions for the validation report. */ }
  }
  if (["width", "height", "font-size"].includes(prop) && /^\d+(?:\.\d+)?$/.test(raw) && Number(raw) !== 0) {
    return `${raw}px${important}`;
  }
  if (prop === "text-indent" && /^\d+(?:\.\d+)?$/.test(raw) && Number(raw) !== 0) {
    return `${raw}em${important}`;
  }
  const replacement = prop === "text-align" && lower === "middle" ? "center"
    : prop === "text-align" && lower === "justify-all" ? "justify"
    : prop === "text-align" && lower === "lift" ? "left"
    : prop === "vertical-align" && lower === "bottom" ? "bottom"
    : prop === "vertical-align" && ["center", "text-middle", "duokan-middle-line"].includes(lower) ? "middle"
    : prop === "vertical-align" && lower === "text-baseline" ? "baseline"
    : prop === "font-weight" && lower === "blod" ? "bold"
    : prop === "font-weight" && lower === "regular" ? "normal"
    : prop === "text-justify" && lower === "inter-ideograph" ? "inter-character"
    : prop === "text-justify" && lower === "distribute" ? "inter-character"
    : prop === "writing-mode" && lower === "horizontal" ? "horizontal-tb"
    : prop === "writing-mode" && lower === "vertical-tb" ? "vertical-rl"
    : ["background-position", "background-repeat"].includes(prop) && lower === "initial initial" ? "initial"
    : prop === "letter-spacing" && lower === "auto" ? "normal"
    : prop === "text-orientation" && lower === "vertical-right" ? "mixed" : null;
  if (replacement) return replacement + important;
  if (/^(["']).*\1$/.test(raw)) {
    try {
      const unquoted = raw.slice(1, -1);
      if (validateDeclaration(prop, csstree.parse(raw, { context: "value" }), atruleName) &&
          !validateDeclaration(prop, csstree.parse(unquoted, { context: "value" }), atruleName)) return unquoted + important;
    } catch { /* Keep unknown values for the validation report. */ }
  }
  return value;
}

export function analyzeDeclarationList(style, options = {}) {
  const issues = [];
  for (const raw of normalizeCssText(style).split(";")) {
    const decl = raw.trim();
    if (!decl || !decl.includes(":")) continue;
    const [propertyPart, ...valueParts] = decl.split(":");
    const property = propertyPart.trim();
    const value = valueParts.join(":").trim();
    if (!property || !value) continue;
    if (isDeniedDeclaration(property, value)) {
      issues.push({ type: "denied-declaration", file: options.file, property, value, message: "已知 EPUB 高風險 CSS 宣告" });
      continue;
    }
    if (hasUnsafeUrl(value)) {
      issues.push({ type: "unsafe-url", file: options.file, property, value, message: "CSS 宣告引用遠端或本機裝置資源" });
      continue;
    }
    try {
      const valueAst = csstree.parse(decl, { context: "declaration" }).value;
      const error = validateDeclaration(property, valueAst);
      if (error) issues.push({ type: "invalid-value", file: options.file, property, value, message: error });
    } catch (error) {
      issues.push({ type: "parse-error", file: options.file, property, value, message: error.message });
    }
  }
  return issues;
}

export function fixDeclarationList(style) {
  const kept = [];
  const source = normalizeCssText(style);
  let declarations;
  try {
    declarations = csstree.parse(source, { context: "declarationList", positions: true }).children.toArray()
      .map(node => source.slice(node.loc.start.offset, node.loc.end.offset).replace(/;\s*$/, ""));
  } catch { return style; } // 無法辨識邊界時保留原值回報，不拆開字串或URL。
  for (const raw of declarations) {
    const decl = raw.trim();
    if (!decl || !decl.includes(":")) continue;
    const [propertyPart, ...valueParts] = decl.split(":");
    const property = propertyPart.trim();
    const value = valueParts.join(":").trim();
    if (!property || !value) continue;
    if (ENTITY_FRAGMENT_RE.test(value)) continue;
    const separated = splitSwallowedDeclaration(property, value);
    if (separated) {
      kept.push(...separated.filter(decl => !isDeniedDeclaration(decl.split(":")[0], decl.split(":")[1]) && !hasUnsafeUrl(decl)));
      continue;
    }
    if (isDeniedDeclaration(property, value) || hasUnsafeUrl(value)) continue;
    const repairedProperty = repairDeclarationProperty(property, value);
    const repaired = repairDeclarationValue(repairedProperty, value);
    if (repaired !== null) kept.push(`${repairedProperty}: ${repaired}`);
  }
  return kept.join("; ");
}

function fallbackFixCss(css) {
  let output = normalizeCssText(css);
  output = output.replace(UNSAFE_IMPORT_RE, "");
  output = output.replace(/@font-face\s*\{[^{}]*(?:https?:\/\/|file:|res:\/)[^{}]*\}/gi, "");
  output = output.replace(/(?<=[{;])\s*direction\s*:\s*[^;{}]+;?/gi, "");
  output = output.replace(/(?<=[{;])\s*duokan-text-indent\s*:\s*[^;{}]+;?/gi, "");
  output = output.replace(/(?<=[{;])\s*page-break\s*:\s*[^;{}]+;?/gi, "");
  output = output.replace(/(?<=[{;])\s*text-spacing-trim\s*:\s*[^;{}]+;?/gi, "");
  output = output.replace(/(?<=[{;])\s*text-combine-horizontal\s*:\s*all\s*;?/gi, "");
  output = output.replace(/(?<=[{;])\s*text-combine\s*:\s*horizontal\s*;?/gi, "");
  output = output.replace(/(?<=[{;])\s*tb-[\w-]+\s*:\s*[^;{}]+;?/gi, "");
  output = output.replace(UNSAFE_URL_RE, "none");
  return output;
}

export function analyzeCss(css, options = {}) {
  const source = normalizeCssText(css);
  const issues = [];
  try {
    const ast = csstree.parse(source, { positions: true, onParseError(error) {
      issues.push({ type: "parse-error", file: options.file, message: error.message, line: error.line, column: error.column });
    } });
    csstree.walk(ast, function (node) {
      if (node.type !== "Declaration") return;
      const property = node.property;
      const value = propertyValue(node);
      const atruleName = this.atrule?.name?.toLowerCase() || null;
      if (isDeniedDeclaration(property, value)) {
        issues.push({ type: "denied-declaration", file: options.file, property, value, ...loc(node), message: "已知 EPUB 高風險 CSS 宣告" });
        return;
      }
      if (hasUnsafeUrl(value)) {
        issues.push({ type: "unsafe-url", file: options.file, property, value, ...loc(node), message: "CSS 宣告引用遠端或本機裝置資源" });
        return;
      }
      const error = validateDeclaration(property, node.value, atruleName);
      if (error) issues.push({ type: "invalid-value", file: options.file, property, value, ...loc(node), message: error });
    });
  } catch (error) {
    issues.push({ type: "parse-error", file: options.file, message: error.message });
  }
  return { ok: issues.length === 0, file: options.file, issues };
}

export function fixCss(css, options = {}) {
  const source = normalizeCssText(css);
  const beforeIssues = analyzeCss(source, options).issues;
  let output = source;
  let parserFallback = false;
  try {
    const ast = csstree.parse(source, { positions: true });
    const inDesignRules = [];
    let previousEnd = 0;
    let inDesignSection = false;
    ast.children.forEach((node, item) => {
      const preceding = source.slice(previousEnd, node.loc.start.offset);
      const comments = [...preceding.matchAll(/\/\*[\s\S]*?\*\//g)];
      if (comments.length) inDesignSection = /^\/\*\s*[\[【［]\s*InDesign\s*專用[^*]*[\]】］]\s*\*\/$/i.test(comments.at(-1)[0]);
      if (node.type === "Rule" && inDesignSection) inDesignRules.push(item);
      // 已確認為匯出器占位文字，只移除這個完整頂層 Raw 節點。
      if (node.type === "Raw" && /^\s*(?:style_inside\s*;\s*)+$/.test(node.value)) inDesignRules.push(item);
      if (node.type === "Rule" && node.prelude?.type === "Raw") {
        const selector = node.prelude.value.replace(/^\s*(?:style_inside\s*;\s*)+/, "");
        if (selector !== node.prelude.value) {
          try { node.prelude = csstree.parse(selector, { context: "selectorList" }); }
          catch { /* 未知選擇器仍回報，不猜測刪除。 */ }
        }
      }
      if (node.type !== "Rule") inDesignSection = false;
      previousEnd = node.loc.end.offset;
    });
    for (const item of inDesignRules) ast.children.remove(item);
    csstree.walk(ast, {
      enter(node, item, list) {
        // 錯置優先權會令整條字型宣告成為 Raw；仍共用相同驗證後修復。
        if (node.type === "Raw" && this.block?.children === list && !this.declaration) {
          const orphan = /^\s*(background-\s*[\r\n]+\s*border-radius)\s*:\s*([^;]+);?\s*$/i.exec(node.value);
          if (orphan && repairDeclarationProperty(orphan[1], orphan[2]) === "border-radius") {
            list.insertData(csstree.parse(`border-radius:${orphan[2]}`, { context: "declaration" }), item);
            list.remove(item);
            return;
          }
          const family = /^\s*font-family\s*:\s*([^;]+);?\s*$/i.exec(node.value);
          const separated = family && splitSwallowedDeclaration("font-family", family[1]);
          if (separated) {
            for (const declaration of separated) list.insertData(csstree.parse(declaration, { context: "declaration" }), item);
            list.remove(item);
            return;
          }
        }
        // 僅清除宣告區塊中已確認的孤立匯出殘留；字串、選擇器及自訂值不碰。
        if (node.type === "Raw" && this.block?.children === list && !this.declaration && /^\s*,\s*3\s*;\s*$/.test(node.value)) {
          list.remove(item);
          return;
        }
        if (node.type === "Atrule" && node.name.toLowerCase() === "import" && UNSAFE_IMPORT_RE.test(csstree.generate(node))) {
          list?.remove(item);
          return;
        }
        if (node.type === "Atrule" && node.name.toLowerCase() === "font-face" && hasUnsafeUrl(csstree.generate(node))) {
          list?.remove(item);
          return;
        }
        if (node.type !== "Declaration") return;
        const value = propertyValue(node);
        const separated = splitSwallowedDeclaration(node.property, value);
        if (separated && list) {
          for (const declaration of separated) {
            const repairedNode = csstree.parse(declaration, { context: "declaration" });
            if (!isDeniedDeclaration(repairedNode.property, propertyValue(repairedNode)) && !hasUnsafeUrl(propertyValue(repairedNode))) list.insertData(repairedNode, item);
          }
          list.remove(item);
          return;
        }
        const repairedProperty = repairDeclarationProperty(node.property, value, this.atrule?.name?.toLowerCase());
        const repaired = repairDeclarationValue(repairedProperty, value, this.atrule?.name?.toLowerCase());
        if (isDeniedDeclaration(node.property, value) || hasUnsafeUrl(value) || repaired === null ||
            (node.property.toLowerCase() === "src" && this.atrule?.name?.toLowerCase() !== "font-face")) list?.remove(item);
        else {
          node.property = repairedProperty;
          if (repaired !== value) node.value = csstree.parse(repaired, { context: "value" });
        }
      },
    });
    output = csstree.generate(ast);
  } catch {
    parserFallback = true;
    output = fallbackFixCss(source);
  }
  const afterIssues = analyzeCss(output, options).issues;
  return {
    ok: afterIssues.length === 0,
    file: options.file,
    changed: output !== css,
    parserFallback,
    css: output,
    issues: afterIssues,
    fixedIssues: beforeIssues.length - afterIssues.length,
  };
}
