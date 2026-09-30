import * as csstree from "css-tree";

const DENIED_PROPERTIES = new Set(["cellpadding", "cellspacing", "colspan", "direction", "duokan-bleed", "duokan-text-indent", "oeb-column-number", "page-break", "text-spacing-trim"]);
const DENIED_PROPERTY_VALUES = new Map([
  ["text-combine-horizontal", /^all$/i],
  ["text-combine", /^horizontal$/i],
]);
const UNSAFE_URL_RE = /url\(\s*(['"]?)(?:https?:\/\/|file:|res:\/)[^)]+\1\s*\)/i;
const UNSAFE_IMPORT_RE = /@import\s+(?:url\(\s*(['"]?)(?:https?:\/\/|file:|res:\/)[^)]+\1\s*\)|(['"])(?:https?:\/\/|file:|res:\/).*?\2|(?:https?:\/\/|file:|res:\/)[^;]+)[^;]*;/gi;
const ENTITY_FRAGMENT_RE = /&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]+);?/i;

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
  try {
    const match = atruleName === "font-face" || (atruleName === "page" && prop === "size")
      ? csstree.lexer.matchAtruleDescriptor(atruleName, prop, valueAst)
      : csstree.lexer.matchProperty(prop, valueAst);
    const error = match.error?.message;
    // The lexer cannot evaluate custom properties; this is not invalid CSS.
    return error?.includes("Matching for a tree with var() is not supported") ? null : error || null;
  } catch (error) {
    return error.message;
  }
}

function repairDeclarationProperty(property, value, atruleName = null) {
  const prop = property.toLowerCase();
  if (prop === "font-variantion-setting") return "font-variation-settings";
  if (prop === "dispaly") return "display";
  if (prop === "line-hegiht") return "line-height";
  if (prop === "hight") return "height";
  if (prop === "margin-lft") return "margin-left";
  if (prop === "cssword-break") return "word-break";
  if (prop === "white-spack") return "white-space";
  if (prop === "mini-height") return "min-height";
  if (prop === "webkit-text-emphasis") return "-webkit-text-emphasis";
  if (prop === "text-decoration" && /^filled-sesame(?:\s*!important)?$/i.test(value.trim())) return "text-emphasis-style";
  if (prop === "font-style" && /^(?:bold|bolder|lighter|[1-9]00)$/i.test(value.trim().replace(/\s*!important\s*$/i, ""))) return "font-weight";
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
      if (parts.length > 4 || (prop !== spacing[1] && parts.length > 1)) return null;
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
    : prop === "vertical-align" && ["center", "duokan-middle-line"].includes(lower) ? "middle"
    : prop === "vertical-align" && lower === "text-baseline" ? "baseline"
    : prop === "font-weight" && lower === "blod" ? "bold"
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
      const valueAst = csstree.parse(value, { context: "value" });
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
  for (const raw of normalizeCssText(style).split(";")) {
    const decl = raw.trim();
    if (!decl || !decl.includes(":")) continue;
    const [propertyPart, ...valueParts] = decl.split(":");
    const property = propertyPart.trim();
    const value = valueParts.join(":").trim();
    if (!property || !value) continue;
    if (ENTITY_FRAGMENT_RE.test(value)) continue;
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
    const ast = csstree.parse(source, { positions: true });
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
    csstree.walk(ast, {
      enter(node, item, list) {
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
