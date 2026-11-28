import { agentLink } from "@/lib/agent-links";
import type { ComponentRecord } from "@/lib/mcp/search";

/**
 * Text of the MCP answers that name components. The `.md` link is what the
 * agent fetches as data and stays bare; the HTML page is what it shows the
 * person, so it carries the agent UTM tags.
 */

export const PREVIEW_LABEL = "Preview & customize";

export function componentPage(record: ComponentRecord): string {
  return record.docs.replace(/\.md$/, "");
}

export function previewLink(record: ComponentRecord, source: string): string {
  return agentLink(componentPage(record), source);
}

function lengthLabel(length: ComponentRecord["length"]): string {
  if (length === undefined) return "—";
  return typeof length === "number" ? `${length}f` : length;
}

export function formatRow(r: ComponentRecord, source: string): string {
  const facts = [r.section, r.vibe, lengthLabel(r.length), r.tier]
    .filter(Boolean)
    .join(" · ");
  const lines = [`- \`${r.name}\` — ${r.title} (${facts})`];
  if (r.useWhen[0]) lines.push(`  Use: ${r.useWhen[0]}`);
  if (r.avoidWhen[0]) lines.push(`  Avoid: ${r.avoidWhen[0]}`);
  lines.push(`  Docs: ${r.docs} · Install: \`${r.install}\``);
  lines.push(`  ${PREVIEW_LABEL}: ${previewLink(r, source)}`);
  return lines.join("\n");
}

/** The component's Markdown with the preview link under its `URL:` line. */
export function withPreviewLink(
  markdown: string,
  record: ComponentRecord,
  source: string,
): string {
  return markdown.replace(
    /^URL: .*$/m,
    (line) => `${line}\n${PREVIEW_LABEL}: ${previewLink(record, source)}`,
  );
}
