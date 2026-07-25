import { formatLength, SITE_URL } from "@/lib/get-llm-text";
import remocnRegistry from "@/registry/remocn/registry.json";
import iconsRegistry from "@/registry/remocn-icons/registry.json";
import remocnUiRegistry from "@/registry/remocn-ui/registry.json";
import { source } from "@/source";

export const revalidate = false;

const TIERS = [
  { tier: "remocn", items: remocnRegistry.items },
  { tier: "remocn-ui", items: remocnUiRegistry.items },
  { tier: "remocn-icons", items: iconsRegistry.items },
] as const;

type RegistryFacts = { tier: string; deps: string[] };

const REGISTRY = new Map<string, RegistryFacts>();
for (const { tier, items } of TIERS) {
  for (const item of items as {
    name: string;
    registryDependencies?: string[];
  }[]) {
    REGISTRY.set(item.name, { tier, deps: item.registryDependencies ?? [] });
  }
}

function sectionTitle(slug: string): string {
  return slug
    ? slug.replace(
        /(^|-)([a-z])/g,
        (_, sep, c) => (sep ? " " : "") + c.toUpperCase(),
      )
    : "Overview";
}

function cell(value: string | undefined): string {
  if (!value) return "—";
  return value
    .replace(/\|/g, "\\|")
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

export function GET() {
  const lines: string[] = [
    "# remocn Component Index",
    "",
    "> Router for every installable remocn component. Scan the tables, pick candidates by",
    "> `Use for` / `Avoid for`, then fetch only the component pages you need.",
    "",
    `Full reference for one component — props, examples, all use / don't-use notes — lives at its`,
    "Docs link below. Every docs URL also serves raw Markdown: append `.md`.",
    "",
    "Install any entry: `npx shadcn@latest add @remocn/<name>` (lands in `components/remocn/`;",
    "`registryDependencies` install transitively).",
    "",
    "`Length` is the component's natural duration at 30fps — budget its `Sequence` accordingly.",
    "`Vibe` is the tonal tag; match it to the brand rather than mixing freely.",
  ];

  const sections = new Map<string, ReturnType<typeof source.getPages>>();
  for (const page of source.getPages()) {
    if (!page.data.component) continue;
    const key = page.slugs[0] ?? "";
    const bucket = sections.get(key) ?? [];
    bucket.push(page);
    sections.set(key, bucket);
  }

  for (const [key, pages] of sections) {
    lines.push("", `## ${sectionTitle(key)}`, "");
    lines.push(
      "| Component | Use for | Avoid for | Length | Vibe | Tier | Deps | Docs |",
    );
    lines.push("|---|---|---|---|---|---|---|---|");

    for (const page of pages.sort((a, b) =>
      a.slugs.join("/").localeCompare(b.slugs.join("/")),
    )) {
      const data = page.data;
      const name = data.component as string;
      const facts = REGISTRY.get(name);
      const deps = facts?.deps.length
        ? facts.deps.map((d) => `\`${d}\``).join(", ")
        : "—";

      lines.push(
        [
          "",
          `\`${name}\``,
          cell(data.useWhen?.[0]),
          cell(data.avoidWhen?.[0]),
          data.length ? formatLength(data.length).replace(" @ 30fps", "") : "—",
          data.vibe ?? "—",
          facts?.tier ?? "—",
          deps,
          `[docs](${SITE_URL}${page.url}.md)`,
          "",
        ].join(" | "),
      );
    }
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
