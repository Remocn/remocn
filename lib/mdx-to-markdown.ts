import JSON5 from "json5";
import { INSTALL_ALL_COMMAND } from "@/config/site";
import { presetsOf } from "@/lib/shader-presets";

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
  "ShaderPresets",
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

function renderShaderPresets(base: string, siteUrl: string): string {
  return presetsOf(base)
    .map(
      (item) =>
        `- [\`${item.name}\`](${siteUrl}${item.href}) — ${item.description} Install: \`npx shadcn@latest add @remocn/${item.name}\``,
    )
    .join("\n");
}

/** A docs page as an index row needs: where it lives and what it is. */
export interface DocsEntry {
  url: string;
  title: string;
  description?: string;
}

/**
 * Lookups into the docs tree for the widgets that render data from it instead
 * of from their props (`CategoryIndex`). Without it those lists are skipped.
 */
export interface DocsLookup {
  entry(url: string): DocsEntry | undefined;
  /** Component pages of a section, in sidebar order. */
  componentEntries(section: string): DocsEntry[];
}

export interface MdxToMarkdownOptions {
  docs?: DocsLookup;
}

/** The `CategoryIndex` being converted: its section and the pages listed so far. */
interface CategoryContext {
  section: string;
  listed: Set<string>;
}

function renderEntryList(entries: DocsEntry[], siteUrl: string): string {
  return entries
    .map((entry) =>
      `- [${entry.title}](${siteUrl}${entry.url}) — ${entry.description ?? ""}`.trimEnd(),
    )
    .join("\n");
}

function fenced(lang: string, body: string): string {
  return [`\`\`\`${lang}`, body, "```"].join("\n");
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function records(value: unknown): Record<string, AttrValue>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, AttrValue> =>
          typeof item === "object" && item !== null && !Array.isArray(item),
      )
    : [];
}

function text(value: AttrValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function absolute(href: string, siteUrl: string): string {
  return href.startsWith("/") ? siteUrl + href : href;
}

/**
 * Widgets whose words live in their props, not their children. Each returns
 * the Markdown placed around the children: `title` replaces the bold title
 * line, `before` and `after` sit on either side of the converted children.
 */
type PropText = (
  attrs: Record<string, AttrValue>,
  ctx: Context,
) => { title?: string; before?: string; after?: string };

const PROP_TEXT: Record<string, PropText> = {
  Step: (a) => ({
    after: text(a.command) && fenced("bash", text(a.command)),
  }),
  RuntimeCommand: (a) => ({
    after: text(a.command) && fenced("bash", text(a.command)),
  }),
  GuideRenderCard: (a) => ({
    before: text(a.prompt) && `Prompt:\n\n${fenced("text", text(a.prompt))}`,
  }),
  FileFlow: (a) => ({
    before: strings(a.steps)
      .map((step) => `\`${step}\``)
      .join(" → "),
  }),
  Tier: (a, { siteUrl, docs }) => ({
    title: [text(a.name), text(a.registry) && `(\`@${text(a.registry)}\`)`]
      .filter(Boolean)
      .join(" "),
    after: records(a.links)
      .map((link) => {
        const href = text(link.href);
        const label =
          text(link.label) ||
          docs?.entry(href)?.title ||
          href.split("/").pop() ||
          href;
        return `- [${label}](${absolute(href, siteUrl)})`;
      })
      .join("\n"),
  }),
  GuideFacts: (a) => ({
    before: records(a.facts)
      .map((fact) => `- **${text(fact.value)}** — ${text(fact.label)}`)
      .join("\n"),
  }),
  HowItWorks: (a) => ({
    before: records(a.steps)
      .map(
        (step, index) =>
          `${index + 1}. **${text(step.title)}** — ${text(step.body)}`,
      )
      .join("\n"),
  }),
  AgentSkillPanel: (a) => ({
    before: [
      text(a.lead),
      strings(a.steps)
        .map((step) => `- ${step}`)
        .join("\n"),
      text(a.from) &&
        text(a.to) &&
        `From “${text(a.from)}” to “${text(a.to)}”.`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  }),
  ApiChips: (a) => ({
    before: [
      strings(a.uses).length &&
        `Uses ${strings(a.uses)
          .map((use) => `\`${use}\``)
          .join(", ")}.`,
      text(a.avoids) &&
        `Avoids \`${text(a.avoids)}\`${text(a.avoidsNote) ? ` ${text(a.avoidsNote)}` : ""}.`,
    ]
      .filter(Boolean)
      .join(" "),
  }),
  RuntimeRules: (a) => ({
    before: [
      strings(a.not).length &&
        `No ${strings(a.not)
          .map((rule) => `\`${rule}\``)
          .join(", ")}.`,
      text(a.only) && `Only \`${text(a.only)}\`.`,
    ]
      .filter(Boolean)
      .join(" "),
  }),
  TemplateCard: (a) => ({
    after: [
      strings(a.inside).length && `Inside: ${strings(a.inside).join(", ")}.`,
      text(a.name) &&
        fenced("bash", `npx shadcn@latest add @remocn/${text(a.name)}`),
    ]
      .filter(Boolean)
      .join("\n\n"),
  }),
  TranscriptSources: (a) => ({
    before: [
      records(a.sources)
        .map((source) => {
          const code = text(source.code) ? ` (\`${text(source.code)}\`)` : "";
          return `- **${text(source.title)}** — ${text(source.body)}${code}`;
        })
        .join("\n"),
      text(a.note),
    ]
      .filter(Boolean)
      .join("\n\n"),
  }),
};

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

/**
 * Length of an MDX `import` statement starting at `start` (the page's own
 * component imports; never inside code fences, which are copied verbatim).
 */
function importLength(src: string, start: number): number {
  const statement = /^import\s[\s\S]*?\sfrom\s+["'][^"']+["'];?[ \t]*\n?/.exec(
    src.slice(start),
  );
  return statement ? statement[0].length : 0;
}

/** After a dropped widget, don't leave a second blank line behind. */
function skipBlankAfterDrop(src: string, i: number, out: string): number {
  let next = i;
  if (out.endsWith("\n\n") || out === "") {
    while (src[next] === "\n") next += 1;
  }
  return next;
}

export function stripFrontmatter(src: string): string {
  if (!src.startsWith("---")) return src;
  const end = src.indexOf("\n---", 3);
  if (end === -1) return src;
  const after = src.indexOf("\n", end + 1);
  return after === -1 ? "" : src.slice(after + 1);
}

/** True when the line `out` ends on holds nothing but indentation. */
function atBlockStart(out: string): boolean {
  return /(^|\n)[ \t]*$/.test(out);
}

/**
 * Append a block-level piece as its own paragraph. Without the blank line a
 * widget's text would run into the previous line's paragraph.
 */
function appendBlock(out: string, block: string): string {
  if (!block) return out;
  const trimmed = out.replace(/[ \t]+$/, "");
  if (!trimmed) return block;
  if (trimmed.endsWith("\n\n")) return trimmed + block;
  return trimmed + (trimmed.endsWith("\n") ? "\n" : "\n\n") + block;
}

interface Context {
  siteUrl: string;
  docs?: DocsLookup;
  category?: CategoryContext;
}

export function mdxToMarkdown(
  src: string,
  siteUrl: string,
  options: MdxToMarkdownOptions = {},
): string {
  return convert(src, { siteUrl, docs: options.docs });
}

/** `<ComponentGroup items>`: its heading and lead, then its pages. */
function renderComponentGroup(
  attrs: Record<string, AttrValue>,
  inner: string,
  ctx: Context,
): string {
  const { docs, category } = ctx;
  if (!docs || !category) return inner;
  const entries = strings(attrs.items)
    .map((item) =>
      docs.entry(item.startsWith("/") ? item : `${category.section}/${item}`),
    )
    .filter((entry): entry is DocsEntry => Boolean(entry));
  for (const entry of entries) category.listed.add(entry.url);
  return [inner, renderEntryList(entries, ctx.siteUrl)]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * `<CategoryIndex section>`: its groups, then every component page no group
 * listed (under "More" when there were groups), as the HTML index does.
 */
function renderCategoryIndex(
  attrs: Record<string, AttrValue>,
  body: string | null,
  ctx: Context,
): string {
  const section = text(attrs.section);
  if (!ctx.docs || !section) return body ? convert(body, ctx).trim() : "";
  const category: CategoryContext = { section, listed: new Set() };
  const groups = body ? convert(body, { ...ctx, category }).trim() : "";
  const rest = ctx.docs
    .componentEntries(section)
    .filter((entry) => !category.listed.has(entry.url));
  const more = rest.length
    ? [
        category.listed.size ? "## More" : "",
        renderEntryList(rest, ctx.siteUrl),
      ]
        .filter(Boolean)
        .join("\n\n")
    : "";
  return [groups, more].filter(Boolean).join("\n\n");
}

function convert(src: string, ctx: Context): string {
  const { siteUrl } = ctx;
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

      const imported = importLength(src, i);
      if (imported) {
        i += imported;
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
              const inner = convert(src.slice(tagEnd.end, closeIndex), ctx);
              const label = typeof attrs.title === "string" ? attrs.title : tag;
              out += blockquote(inner, label);
              i = closeIndex + `</${tag}>`.length;
              continue;
            }
          }

          if (DROPPED_WIDGETS.has(tag)) {
            i = tagEnd.end;
            i = skipBlankAfterDrop(src, i, out);
            continue;
          }

          let replacement = "";
          if (tag === "InstallBlock" && typeof attrs.name === "string") {
            replacement = [
              "## Installation",
              "",
              "```bash",
              `npx shadcn@latest add @remocn/${attrs.name}`,
              "```",
            ].join("\n");
          } else if (tag === "InstallAll") {
            replacement = ["```bash", INSTALL_ALL_COMMAND, "```"].join("\n");
          } else if (tag === "PropsTable") {
            replacement = renderPropsTable(attrs.rows);
            if (typeof attrs.title === "string") {
              replacement = `## ${attrs.title}\n\n${replacement}`;
            }
          } else if (tag === "ComponentCardGrid") {
            replacement = renderCardGrid(attrs.items, siteUrl);
          } else if (
            tag === "ShaderPresets" &&
            typeof attrs.base === "string"
          ) {
            replacement = renderShaderPresets(attrs.base, siteUrl);
          } else if (tag === "Dependencies") {
            replacement = renderDependencies(attrs.items);
          }

          out += replacement;
          i = tagEnd.end;
          continue;
        }
      }

      // Any other component (guide and index blocks): its markdown children
      // are the content, so keep those and drop the tags. A string `title`
      // is kept as a bold line. Widgets in PROP_TEXT also carry words in
      // their props; other self-closing ones are visual only.
      if (tag) {
        const tagEnd = findTagEnd(src, i + 1 + tag.length);
        const closeIndex =
          tagEnd && !tagEnd.selfClosing
            ? findClosingTag(src, tag, tagEnd.end)
            : -1;
        if (tagEnd && (tagEnd.selfClosing || closeIndex !== -1)) {
          const attrs = parseAttrs(
            src.slice(
              i + 1 + tag.length,
              tagEnd.end - (tagEnd.selfClosing ? 2 : 1),
            ),
          );
          const body = tagEnd.selfClosing
            ? null
            : src.slice(tagEnd.end, closeIndex);
          const next = tagEnd.selfClosing
            ? tagEnd.end
            : closeIndex + `</${tag}>`.length;

          if (tag === "CategoryIndex") {
            out = appendBlock(out, renderCategoryIndex(attrs, body, ctx));
            i = next;
            continue;
          }

          const propText = PROP_TEXT[tag]?.(attrs, ctx);
          if (tagEnd.selfClosing && !propText) {
            i = skipBlankAfterDrop(src, next, out);
            continue;
          }

          let inner = body === null ? "" : convert(body, ctx).trim();
          if (tag === "ComponentGroup") {
            inner = renderComponentGroup(attrs, inner, ctx);
          }
          const titleText =
            propText?.title ||
            (typeof attrs.title === "string" ? attrs.title : "");
          const block = [
            titleText && `**${titleText}**`,
            propText?.before,
            inner,
            propText?.after,
          ]
            .filter(Boolean)
            .join("\n\n");
          out = atBlockStart(out) ? appendBlock(out, block) : out + block;
          i = next;
          continue;
        }
      }
    }

    out += src[i];
    i += 1;
  }

  return out;
}
