import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { Glob } from "bun";
import { VIBES } from "./docs-schema";

const REGISTRIES = ["remocn", "remocn-ui", "remocn-icons"] as const;

const UNDOCUMENTED: Record<string, string> = {
  "remocn-ui": "shared core lib, not installed directly",
  "stop-motion": "shared lib behind the paper tier",
  "scene-motion": "shared motion vocabulary lib",
  brush: "ribbon primitive consumed by the ink marks, not used on its own",
  "select-item": "folds into the select page",
  "dropdown-menu-item": "folds into the dropdown-menu page",
  "command-menu-item": "folds into the command-menu page",
  "icons-core": "shared icon runtime",
};

function isIcon(name: string): boolean {
  return name.startsWith("icon-");
}

interface Page {
  file: string;
  frontmatter: Record<string, unknown>;
}

function loadPages(): Page[] {
  const pages: Page[] = [];
  for (const file of new Glob("content/docs/**/*.mdx").scanSync(".")) {
    const src = readFileSync(file, "utf8");
    const end = src.indexOf("\n---", 3);
    if (!src.startsWith("---") || end === -1) {
      throw new Error(`${file} has no frontmatter`);
    }
    pages.push({
      file,
      frontmatter: (Bun.YAML.parse(src.slice(4, end)) ?? {}) as Record<
        string,
        unknown
      >,
    });
  }
  return pages;
}

function registryItems(): { name: string; registry: string }[] {
  return REGISTRIES.flatMap((registry) => {
    const reg = JSON.parse(
      readFileSync(`registry/${registry}/registry.json`, "utf8"),
    );
    return (reg.items as { name: string }[]).map((item) => ({
      name: item.name,
      registry,
    }));
  });
}

const pages = loadPages();
const items = registryItems();
const documented = new Map<string, string>();
for (const page of pages) {
  const name = page.frontmatter.component;
  if (typeof name === "string") documented.set(name, page.file);
}

describe("docs cover the registry", () => {
  it("every installable component has a docs page declaring it", () => {
    const missing = items
      .filter(({ name }) => !isIcon(name) && !(name in UNDOCUMENTED))
      .filter(({ name }) => !documented.has(name))
      .map(({ registry, name }) => `${registry}/${name}`);

    expect(missing).toEqual([]);
  });

  it("the undocumented allowlist has no stale entries", () => {
    const known = new Set(items.map((i) => i.name));
    const stale = Object.keys(UNDOCUMENTED).filter((name) => !known.has(name));

    expect(stale).toEqual([]);
  });

  it("no allowlisted component secretly has a page", () => {
    const contradictions = Object.keys(UNDOCUMENTED).filter((name) =>
      documented.has(name),
    );

    expect(contradictions).toEqual([]);
  });

  it("icons are documented through the gallery", () => {
    const gallery = readFileSync("content/docs/icons/gallery.mdx", "utf8");

    expect(gallery).toContain("<IconsGallery");
  });
});

describe("component pages carry selection metadata", () => {
  const componentPages = pages.filter(
    (p) => typeof p.frontmatter.component === "string",
  );

  it("declares a component name that exists in a registry", () => {
    const known = new Set(items.map((i) => i.name));
    const unknown = componentPages
      .filter((p) => !known.has(p.frontmatter.component as string))
      .map((p) => `${p.file} -> ${p.frontmatter.component}`);

    expect(unknown).toEqual([]);
  });

  it("declares each component on exactly one page", () => {
    const seen = new Map<string, string[]>();
    for (const page of componentPages) {
      const name = page.frontmatter.component as string;
      seen.set(name, [...(seen.get(name) ?? []), page.file]);
    }
    const duplicated = [...seen.entries()]
      .filter(([, files]) => files.length > 1)
      .map(([name, files]) => `${name}: ${files.join(", ")}`);

    expect(duplicated).toEqual([]);
  });

  it("carries a canonical vibe", () => {
    const offenders = componentPages
      .filter(
        (p) => !VIBES.includes(p.frontmatter.vibe as (typeof VIBES)[number]),
      )
      .map((p) => `${p.file} -> ${p.frontmatter.vibe}`);

    expect(offenders).toEqual([]);
  });

  it("carries a natural length", () => {
    const offenders = componentPages
      .filter((p) => {
        const length = p.frontmatter.length;
        if (length === "state-driven") return false;
        return !(
          typeof length === "number" &&
          Number.isInteger(length) &&
          length > 0
        );
      })
      .map((p) => `${p.file} -> ${p.frontmatter.length}`);

    expect(offenders).toEqual([]);
  });

  it("carries non-empty useWhen and avoidWhen entries", () => {
    const offenders: string[] = [];
    for (const page of componentPages) {
      for (const key of ["useWhen", "avoidWhen"] as const) {
        const value = page.frontmatter[key];
        const ok =
          Array.isArray(value) &&
          value.length > 0 &&
          value.every(
            (entry) => typeof entry === "string" && entry.trim().length > 0,
          );
        if (!ok) offenders.push(`${page.file} -> ${key}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it("only cites components that exist", () => {
    const known = new Set(items.map((i) => i.name));
    const offenders: string[] = [];
    for (const page of componentPages) {
      const bullets = [
        ...((page.frontmatter.useWhen as string[]) ?? []),
        ...((page.frontmatter.avoidWhen as string[]) ?? []),
      ];
      for (const bullet of bullets) {
        for (const [, token] of bullet.matchAll(
          /`([a-z][a-z0-9]*(?:-[a-z0-9]+)+)`/g,
        )) {
          if (known.has(token)) continue;
          if (bullet.includes(`not shipped`)) continue;
          offenders.push(`${page.file} cites \`${token}\``);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe("the agent skill points at pages that exist", () => {
  const skillSources = [...new Glob("skills/**/*.md").scanSync(".")].map(
    (file) => ({
      file,
      text: readFileSync(file, "utf8"),
    }),
  );

  const urls = skillSources.flatMap(({ file, text }) =>
    [...text.matchAll(/https:\/\/remocn\.dev(\/[^\s`)"']*)/g)].map((m) => ({
      file,
      path: m[1],
    })),
  );

  it("cites at least the component index", () => {
    expect(urls.some((u) => u.path === "/llms-components.txt")).toBe(true);
  });

  it("every cited docs page resolves to a real file", () => {
    const slugs = new Set(
      pages.map((p) =>
        p.file.replace(/^content\/docs\//, "").replace(/\.mdx$/, ""),
      ),
    );
    const broken = urls
      .filter(({ path }) => path.startsWith("/docs/"))
      .map(({ file, path }) => ({
        file,
        path,
        slug: path.replace(/^\/docs\//, "").replace(/\.md$/, ""),
      }))
      .filter(
        ({ slug }) =>
          !slug.includes("<") &&
          !slugs.has(slug) &&
          !slugs.has(`${slug}/index`),
      )
      .map(({ file, path }) => `${file} -> ${path}`);

    expect(broken).toEqual([]);
  });

  it("no longer ships a bundled component catalog", () => {
    const catalog = [
      ...new Glob("skills/remocn/references/components/**").scanSync("."),
    ];

    expect(catalog).toEqual([]);
  });
});

describe("navigation lists every page", () => {
  it("each component page appears in its section meta.json", () => {
    const missing: string[] = [];
    for (const page of pages) {
      if (typeof page.frontmatter.component !== "string") continue;
      const dir = page.file.slice(0, page.file.lastIndexOf("/"));
      const meta = JSON.parse(readFileSync(`${dir}/meta.json`, "utf8"));
      const slug = basename(page.file, ".mdx");
      if (!(meta.pages as string[]).includes(slug)) missing.push(page.file);
    }

    expect(missing).toEqual([]);
  });
});
