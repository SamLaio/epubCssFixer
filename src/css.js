import * as csstree from "css-tree";

const DENIED_PROPERTIES = new Set(["direction", "duokan-text-indent", "text-spacing-trim"]);
const DENIED_PROPERTY_VALUES = new Map([
  ["text-combine-horizontal", /^all$/i],
  ["text-combine", /^horizontal$/i],
]);
const UNSAFE_URL_RE = /url\(\s*(['"]?)(?:https?:\/\/|file:|res:\/)[^)]+\1\s*\)/i;
const UNSAFE_IMPORT_RE = /@import\s+(?:url\(\s*(['"]?)(?:https?:\/\/|file:|res:\/)[^)]+\1\s*\)|(['"])(?:https?:\/\/|file:|res:\/).*?\2|(?:https?:\/\/|file:|res:\/)[^;]+)[^;]*;/gi;

function loc(node) {
  return {
    line: node?.loc?.start?.line || null,
    column: node?.loc?.start?.column || null,
  };
}

function normalizeCssText(css) {
  return css.replace(/[^\S\r\n]+/g, " ").replace(/％/g, "%").replace(/：/g, ":");
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
  if (DENIED_PROPERTIES.has(prop)) return true;
  const valueRule = DENIED_PROPERTY_VALUES.get(prop);
  return Boolean(valueRule && valueRule.test(value.trim()));
}

function hasUnsafeUrl(value) {
  return UNSAFE_URL_RE.test(value);
}

function validateDeclaration(property, valueAst) {
  const prop = property.toLowerCase();
  if (prop.startsWith("-") || prop.startsWith("--")) return null;
  try {
    const match = csstree.lexer.matchProperty(prop, valueAst);
    return match.error ? match.error.message : null;
  } catch (error) {
    return error.message;
  }
}

export function analyzeDeclarationList(style, options = {}) {
  const issues = [];
  for (const raw of style.split(";")) {
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
  for (const raw of style.split(";")) {
    const decl = raw.trim();
    if (!decl || !decl.includes(":")) continue;
    const [propertyPart, ...valueParts] = decl.split(":");
    const property = propertyPart.trim();
    const value = valueParts.join(":").trim();
    if (!property || !value) continue;
    if (isDeniedDeclaration(property, value) || hasUnsafeUrl(value)) continue;
    kept.push(`${property}: ${value}`);
  }
  return kept.join("; ");
}

function fallbackFixCss(css) {
  let output = normalizeCssText(css);
  output = output.replace(UNSAFE_IMPORT_RE, "");
  output = output.replace(/@font-face\s*\{[^{}]*(?:https?:\/\/|file:|res:\/)[^{}]*\}/gi, "");
  output = output.replace(/(?<=[{;])\s*direction\s*:\s*[^;{}]+;?/gi, "");
  output = output.replace(/(?<=[{;])\s*duokan-text-indent\s*:\s*[^;{}]+;?/gi, "");
  output = output.replace(/(?<=[{;])\s*text-spacing-trim\s*:\s*[^;{}]+;?/gi, "");
  output = output.replace(/(?<=[{;])\s*text-combine-horizontal\s*:\s*all\s*;?/gi, "");
  output = output.replace(/(?<=[{;])\s*text-combine\s*:\s*horizontal\s*;?/gi, "");
  output = output.replace(UNSAFE_URL_RE, "none");
  return output;
}

export function analyzeCss(css, options = {}) {
  const source = normalizeCssText(css);
  const issues = [];
  try {
    const ast = csstree.parse(source, { positions: true });
    csstree.walk(ast, (node) => {
      if (node.type !== "Declaration") return;
      const property = node.property;
      const value = propertyValue(node);
      if (isDeniedDeclaration(property, value)) {
        issues.push({ type: "denied-declaration", file: options.file, property, value, ...loc(node), message: "已知 EPUB 高風險 CSS 宣告" });
        return;
      }
      if (hasUnsafeUrl(value)) {
        issues.push({ type: "unsafe-url", file: options.file, property, value, ...loc(node), message: "CSS 宣告引用遠端或本機裝置資源" });
        return;
      }
      const error = validateDeclaration(property, node.value);
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
        if (isDeniedDeclaration(node.property, value) || hasUnsafeUrl(value)) list?.remove(item);
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
