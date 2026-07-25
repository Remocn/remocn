import JSON5 from "json5";
import { INSTALL_ALL_COMMAND } from "@/config/site";

type AttrValue =
  | string
  | number
  | boolean
  | null
  | AttrValue[]
  | { [k: string]: AttrValue };

interface PropRow {
  name?: string;
  type?: string;
  default?: string;
  required?: boolean;
  description?: string;
}

interface CardItem {
  name?: string;
  description?: string;
  status?: string;
  href?: string;
}

const DROPPED_WIDGETS = new Set([
  "ComponentPreview",
  "UiComponentPreview",
  "BlockPreview",
  "ComponentExample",
  "IconsGallery",
  "GuideVideo",
]);

const CONTAINER_WIDGETS = new Set(["Note", "Warning"]);

const SELF_CLOSING_WIDGETS = new Set([
  ...DROPPED_WIDGETS,
  "InstallBlock",
  "InstallAll",
  "PropsTable",
  "Dependencies",
  "ComponentCardGrid",
]);

function skipQuoted(src: string, start: number): number {
  const quote = src[start];
  let i = start + 1;
  while (i < src.length) {
    if (src[i] === "\\") {
      i += 2;
      continue;
    }
    if (src[i] === quote) return i + 1;
    i += 1;
  }
  return i;
}

function findTagEnd(
  src: string,
  start: number,
): { end: number; selfClosing: boolean } | null {
  let i = start;
  let depth = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      i = skipQuoted(src, i);
      continue;
    }
    if (c === "{") {
      depth += 1;
      i += 1;
      continue;
    }
    if (c === "}") {
      depth -= 1;
      i += 1;
      continue;
    }
    if (depth === 0) {
      if (c === "/" && src[i + 1] === ">")
        return { end: i + 2, selfClosing: true };
      if (c === ">") return { end: i + 1, selfClosing: false };
    }
    i += 1;
  }
  return null;
}

function parseAttrs(raw: string): Record<string, AttrValue> {
  const attrs: Record<string, AttrValue> = {};
  let i = 0;
  while (i < raw.length) {
    while (i < raw.length && /\s/.test(raw[i])) i += 1;
    const nameStart = i;
    while (i < raw.length && /[\w-]/.test(raw[i])) i += 1;
    if (i === nameStart) {
      i += 1;
      continue;
    }
    const name = raw.slice(nameStart, i);
    while (i < raw.length && /\s/.test(raw[i])) i += 1;
    if (raw[i] !== "=") {
      attrs[name] = true;
      continue;
    }
    i += 1;
    while (i < raw.length && /\s/.test(raw[i])) i += 1;
    if (raw[i] === '"' || raw[i] === "'") {
      const end = skipQuoted(raw, i);
      attrs[name] = raw.slice(i + 1, end - 1);
      i = end;
      continue;
    }
    if (raw[i] === "{") {
      let depth = 0;
      const exprStart = i;
      while (i < raw.length) {
        const c = raw[i];
        if (c === '"' || c === "'" || c === "`") {
          i = skipQuoted(raw, i);
          continue;
        }
        if (c === "{") depth += 1;
        if (c === "}") {
          depth -= 1;
          if (depth === 0) {
            i += 1;
            break;
          }
        }
        i += 1;
      }
      const expr = raw.slice(exprStart + 1, i - 1);
      try {
        attrs[name] = JSON5.parse(expr);
      } catch {
        attrs[name] = expr.trim();
      }
      continue;
    }
    i += 1;
  }
  return attrs;
}

function cell(value: string | undefined): string {
  if (!value) return "—";
  return value
    .replace(/\|/g, "\\|")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

function renderPropsTable(rows: unknown): string {
  if (!Array.isArray(rows)) return "";
  const lines = [
    "| Prop | Type | Default | Description |",
    "|---|---|---|---|",
  ];
  for (const row of rows as PropRow[]) {
    const name = row.required
      ? `\`${row.name}\` (required)`
      : `\`${row.name}\``;
    const type = row.type ? `\`${cell(row.type)}\`` : "—";
    const fallback = row.default ? `\`${cell(row.default)}\`` : "—";
    lines.push(
      `| ${name} | ${type} | ${fallback} | ${cell(row.description)} |`,
    );
  }
  return lines.join("\n");
}

function renderCardGrid(items: unknown, siteUrl: string): string {
  if (!Array.isArray(items)) return "";
  return (items as CardItem[])
    .map((item) => {
      const label = item.href
        ? `[${item.name}](${item.href.startsWith("/") ? siteUrl + item.href : item.href})`
        : item.name;
      const soon = item.status === "soon" ? " _(coming soon)_" : "";
      return `- ${label}${soon} — ${item.description ?? ""}`.trimEnd();
    })
    .join("\n");
}

function renderDependencies(items: unknown): string {
  if (!Array.isArray(items) || items.length === 0) return "";
  return `Requires: ${items.map((i) => `\`${String(i)}\``).join(", ")}`;
}

function blockquote(body: string, label: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";
  const lines = [`**${label}**`, "", trimmed].join("\n");
  return lines
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n");
}

function findClosingTag(src: string, tag: string, from: number): number {
  const open = new RegExp(`<${tag}[\\s>]`, "g");
  const close = new RegExp(`</${tag}\\s*>`, "g");
  let depth = 1;
  let cursor = from;
  while (cursor < src.length) {
    close.lastIndex = cursor;
    const nextClose = close.exec(src);
    if (!nextClose) return -1;
    open.lastIndex = cursor;
    let nested = 0;
    let m = open.exec(src);
    while (m && m.index < nextClose.index) {
      nested += 1;
      m = open.exec(src);
    }
    depth += nested - 1;
    if (depth === 0) return nextClose.index;
    cursor = nextClose.index + nextClose[0].length;
  }
  return -1;
}

export function stripFrontmatter(src: string): string {
  if (!src.startsWith("---")) return src;
  const end = src.indexOf("\n---", 3);
  if (end === -1) return src;
  const after = src.indexOf("\n", end + 1);
  return after === -1 ? "" : src.slice(after + 1);
}

export function mdxToMarkdown(src: string, siteUrl: string): string {
  let out = "";
  let i = 0;

  while (i < src.length) {
    const atLineStart = i === 0 || src[i - 1] === "\n";

    if (atLineStart) {
      const fence = /^([ \t]{0,3})(`{3,}|~{3,})/.exec(src.slice(i));
      if (fence) {
        const marker = fence[2];
        const closeRe = new RegExp(
          `\\n[ \\t]{0,3}\\${marker[0]}{${marker.length},}[ \\t]*(?=\\n|$)`,
        );
        const rest = src.slice(i);
        const lineEnd = rest.indexOf("\n");
        const search = lineEnd === -1 ? "" : rest.slice(lineEnd);
        const closing = closeRe.exec(search);
        const blockEnd =
          closing && lineEnd !== -1
            ? i + lineEnd + closing.index + closing[0].length
            : src.length;
        out += src.slice(i, blockEnd);
        i = blockEnd;
        continue;
      }
    }

    if (src[i] === "<") {
      const nameMatch = /^<([A-Z][A-Za-z0-9]*)/.exec(src.slice(i));
      const tag = nameMatch?.[1];
      if (
        tag &&
        (SELF_CLOSING_WIDGETS.has(tag) || CONTAINER_WIDGETS.has(tag))
      ) {
        const tagEnd = findTagEnd(src, i + 1 + tag.length);
        if (tagEnd) {
          const attrs = parseAttrs(
            src.slice(
              i + 1 + tag.length,
              tagEnd.end - (tagEnd.selfClosing ? 2 : 1),
            ),
          );

          if (CONTAINER_WIDGETS.has(tag) && !tagEnd.selfClosing) {
            const closeIndex = findClosingTag(src, tag, tagEnd.end);
            if (closeIndex !== -1) {
              const inner = mdxToMarkdown(
                src.slice(tagEnd.end, closeIndex),
                siteUrl,
              );
              const label = typeof attrs.title === "string" ? attrs.title : tag;
              out += blockquote(inner, label);
              i = closeIndex + `</${tag}>`.length;
              continue;
            }
          }

          if (DROPPED_WIDGETS.has(tag)) {
            i = tagEnd.end;
            while (src[i] === "\n" && src[i + 1] === "\n") i += 1;
            continue;
          }

          let replacement = "";
          if (tag === "InstallBlock" && typeof attrs.name === "string") {
            replacement = [
              "```bash",
              `npx shadcn@latest add @remocn/${attrs.name}`,
              "```",
            ].join("\n");
          } else if (tag === "InstallAll") {
            replacement = ["```bash", INSTALL_ALL_COMMAND, "```"].join("\n");
          } else if (tag === "PropsTable") {
            replacement = renderPropsTable(attrs.rows);
          } else if (tag === "ComponentCardGrid") {
            replacement = renderCardGrid(attrs.items, siteUrl);
          } else if (tag === "Dependencies") {
            replacement = renderDependencies(attrs.items);
          }

          out += replacement;
          i = tagEnd.end;
          continue;
        }
      }
    }

    out += src[i];
    i += 1;
  }

  return out;
}
