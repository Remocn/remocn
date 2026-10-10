import "server-only";

import { getLLMText, SITE_URL } from "@/lib/get-llm-text";
import type { ComponentRecord } from "@/lib/mcp/search";
import { installCommand } from "@/lib/mcp/search";
import remocnRegistry from "@/registry/remocn/registry.json";
import iconsRegistry from "@/registry/remocn-icons/registry.json";
import templatesRegistry from "@/registry/remocn-templates/registry.json";
import remocnUiRegistry from "@/registry/remocn-ui/registry.json";
import { source } from "@/source";

/**
 * The same facts that power `/llms-components.txt`: registry.json items joined
 * with the docs frontmatter (`component`, `vibe`, `length`, `useWhen`,
 * `avoidWhen`). Built once per process — both inputs are static at runtime.
 */

const TIERS = [
  { tier: "remocn", items: remocnRegistry.items },
  { tier: "remocn-ui", items: remocnUiRegistry.items },
  { tier: "remocn-icons", items: iconsRegistry.items },
  { tier: "remocn-template", items: templatesRegistry.items },
] as const;

export interface RegistryFacts {
  name: string;
  title?: string;
  description?: string;
  tier: string;
  deps: string[];
}

type DocPage = ReturnType<typeof source.getPages>[number];

interface Catalog {
  records: ComponentRecord[];
  byName: Map<string, ComponentRecord>;
  pages: Map<string, DocPage>;
  registry: Map<string, RegistryFacts>;
}

let cached: Catalog | undefined;

export function getCatalog(): Catalog {
  if (cached) return cached;

  const registry = new Map<string, RegistryFacts>();
  for (const { tier, items } of TIERS) {
    for (const item of items as {
      name: string;
      title?: string;
      description?: string;
      registryDependencies?: string[];
    }[]) {
      registry.set(item.name, {
        name: item.name,
        title: item.title,
        description: item.description,
        tier,
        deps: item.registryDependencies ?? [],
      });
    }
  }

  const records: ComponentRecord[] = [];
  const byName = new Map<string, ComponentRecord>();
  const pages = new Map<string, DocPage>();
  for (const page of source.getPages()) {
    const data = page.data;
    const name = data.component;
    if (!name || byName.has(name)) continue;
    const record: ComponentRecord = {
      name,
      title: data.title ?? name,
      description: data.description ?? registry.get(name)?.description ?? "",
      section: page.slugs[0] ?? "",
      docs: `${SITE_URL}${page.url}.md`,
      vibe: data.vibe,
      length: data.length,
      tier: registry.get(name)?.tier,
      useWhen: data.useWhen ?? [],
      avoidWhen: data.avoidWhen ?? [],
      install: installCommand(name),
    };
    records.push(record);
    byName.set(name, record);
    pages.set(name, page);
  }

  cached = { records, byName, pages, registry };
  return cached;
}

export async function getComponentMarkdown(
  name: string,
): Promise<string | undefined> {
  const page = getCatalog().pages.get(name);
  return page ? getLLMText(page) : undefined;
}
