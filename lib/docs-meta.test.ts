import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { Glob } from "bun";
import { VIBES } from "./docs-schema";

const REGISTRIES = [
  "remocn",
  "remocn-ui",
  "remocn-icons",
  "remocn-templates",
] as const;

const UNDOCUMENTED: Record<string, string> = {
  "remocn-ui": "shared core lib, not installed directly",
  "stop-motion": "shared lib behind the paper tier",
  "scene-motion": "shared motion vocabulary lib",
  "canvas-presentation": "shared html-in-canvas scaffolding lib",
  "caption-core": "shared caption paging and timing lib",
  glide: "shared lib that keeps moving text off the pixel grid",
  "frame-rate":
    "shared lib that keeps timings in 30 fps frames at any frame rate",
  timeline:
    "shared lib that keeps a component's schedule apart from its drawing",
  brush: "ribbon primitive consumed by the ink marks, not used on its own",
  "select-item": "folds into the select page",
  "dropdown-menu-item": "folds into the dropdown-menu page",
  "command-menu-item": "folds into the command-menu page",
  "icons-core": "shared icon runtime",
  gsh: "shared gradients.sh shader engine behind the gradient grounds",
  "audit-core": "shared annotation kit behind the design-review scenes",
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
        if (
          length === "state-driven" ||
          length === "sustained" ||
          length === "transcript-driven"
        )
          return false;
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

  it("carries five to eight distinct askedAs phrasings", () => {
    const offenders: string[] = [];
    for (const page of componentPages) {
      const value = page.frontmatter.askedAs;
      const ok =
        Array.isArray(value) &&
        value.length >= 5 &&
        value.length <= 8 &&
        value.every(
          (entry) => typeof entry === "string" && entry.trim().length > 0,
        ) &&
        new Set(value.map((entry) => String(entry).toLowerCase())).size ===
          value.length;
      if (!ok) offenders.push(page.file);
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
  const skillSources = [
    ...new Glob("plugins/remocn/**/*.md").scanSync("."),
  ].map((file) => ({
    file,
    text: readFileSync(file, "utf8"),
  }));

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
      ...new Glob(
        "plugins/remocn/skills/remocn/references/components/**",
      ).scanSync("."),
    ];

    expect(catalog).toEqual([]);
  });
});

describe("navigation lists every page", () => {
  it("each component page appears in its section meta.json", () => {
    const missing: string[] = [];
    for (const page of pages) {
      if (typeof page.frontmatter.component !== "string") continue;
      let dir = page.file.slice(0, page.file.lastIndexOf("/"));
      let slug = basename(page.file, ".mdx");
      // A folder's index page is listed by its folder name in the parent meta.
      if (slug === "index") {
        slug = basename(dir);
        dir = dir.slice(0, dir.lastIndexOf("/"));
      }
      const meta = JSON.parse(readFileSync(`${dir}/meta.json`, "utf8"));
      if (!(meta.pages as string[]).includes(slug)) missing.push(page.file);
    }

    expect(missing).toEqual([]);
  });
});

describe("docs pages compile at runtime", () => {
  // `dynamic` in source.config.ts: a page is compiled when it is rendered,
  // and Fumadocs rules out `import` and `export` in pages compiled that way.
  // What a page needs is registered in components/docs/mdx-page-components.ts.
  it("no page imports or exports", () => {
    const offenders: string[] = [];
    for (const { file } of pages) {
      let fenced = false;
      for (const line of readFileSync(file, "utf8").split("\n")) {
        if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
        else if (!fenced && /^(import|export)\s/.test(line)) {
          offenders.push(file);
          break;
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe("previews are built outside the site's bundler", () => {
  // registry/__index__.tsx lazily imports ~900 previews, and Turbopack
  // compiles lazy imports up front: in the site's module graph the index
  // made the first request of any page with a preview compile them all. The
  // site loads the index as a separate bundle instead (lib/previews/index.ts).
  it("no site code imports the registry index", () => {
    const files = [
      ...new Glob("*.{ts,tsx}").scanSync("."),
      ...["app", "components", "config", "hooks", "lib"].flatMap((folder) => [
        ...new Glob(`${folder}/**/*.{ts,tsx}`).scanSync("."),
      ]),
      // Blog and changelog pages go through the bundler and may import.
      ...new Glob("content/{blog,changelog}/**/*.mdx").scanSync("."),
    ];
    const offenders = files.filter((file) => {
      // Tests run under Bun, not in the site's bundle.
      if (/\.test\.tsx?$/.test(file)) return false;
      let source = readFileSync(file, "utf8");
      source = file.endsWith(".mdx")
        ? // Prose may name the file; only its import lines count.
          source
            .split("\n")
            .filter((line) => /^(import|export)\s/.test(line))
            .join(";\n")
        : // Comments may name it too.
          source
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
      // A module specifier that ends at the index, in whatever statement
      // holds it: import, export … from, import(), require().
      const specifier = /["'`][^"'`\n]*registry\/__index__(\.tsx?)?["'`]/g;
      for (const match of source.matchAll(specifier)) {
        const before = source.slice(0, match.index);
        const statement = before.slice(before.lastIndexOf(";") + 1);
        // Type-only forms are erased, so they stay allowed.
        const typeOnly =
          /^\s*((import|export) )?type\b/.test(statement) ||
          /typeof import\(\s*$/.test(before);
        if (!typeOnly) return true;
      }
      return false;
    });

    expect(offenders).toEqual([]);
  });

  // The site tells a known preview from an unknown one by this list, without
  // loading the bundle. Any previews build rewrites it (`bun dev`,
  // `bun run build`, `bun run previews:build`); commit the result.
  it("registry/__names__.ts lists the keys of the registry index", async () => {
    const { default: registry } = await import("@/registry/__index__");
    const { previewNames } = await import("@/registry/__names__");

    expect<string[]>([...previewNames]).toEqual(Object.keys(registry));
  });
});

describe("components count time on the 30 fps timeline", () => {
  // Timings in the registry are 30 fps frames. Read through Remotion's own
  // hooks they change meaning with the composition's frame rate, so a
  // component reads the frame and the config from `@/lib/remocn/frame-rate`.
  // Templates carry their own frame rate and convert it themselves.
  it("no component reads the frame or the config straight from remotion", () => {
    const offenders = ["remocn", "remocn-ui", "remocn-icons"]
      .flatMap((space) => [
        ...new Glob(`registry/${space}/**/*.{ts,tsx}`).scanSync("."),
      ])
      .filter(
        (file) =>
          !file.includes("/__tests__/") &&
          !/\.test\.tsx?$/.test(file) &&
          !file.startsWith("registry/remocn/frame-rate/"),
      )
      .filter((file) =>
        /import\s*\{[^}]*\b(useCurrentFrame|useVideoConfig)\b[^}]*\}\s*from\s*"remotion"/.test(
          readFileSync(file, "utf8"),
        ),
      );

    expect(offenders).toEqual([]);
  });
});

describe("components with a timeline read it through useTimeline", () => {
  // A component's schedule lives in `timeline.ts` beside it, as a pure
  // function of its props, so remocn lab can lay the elements out on a
  // timeline and a `timing` prop can move them. The component reads its
  // frames from that schedule; a timing computed inline again is invisible
  // to both.
  const timelines = [
    ...new Glob("registry/remocn/*/timeline.ts").scanSync("."),
  ].sort();

  it("every component with a timeline.ts calls useTimeline on it", () => {
    const offenders = timelines.filter((file) => {
      const component = readFileSync(
        file.replace(/timeline\.ts$/, "index.tsx"),
        "utf8",
      );
      return !(
        /from\s*"\.\/timeline"/.test(component) &&
        /\buseTimeline\(/.test(component)
      );
    });

    expect(offenders).toEqual([]);
  });

  it("a timeline.ts imports nothing that renders or reads the outside world", () => {
    const offenders = timelines.filter((file) => {
      const source = readFileSync(file, "utf8");
      const imports = [...source.matchAll(/from\s*"([^"]+)"/g)].map(
        (match) => match[1],
      );
      return (
        imports.some((module) => module !== "@/lib/remocn/timeline") ||
        /\b(Math\.random|Date\.now|new Date|performance|document|window|globalThis)\b/.test(
          source,
        )
      );
    });

    expect(offenders).toEqual([]);
  });

  it("schedules are pure, in time order, with unique ids", async () => {
    const problems: string[] = [];
    for (const file of timelines) {
      const dir = file.replace(/\/timeline\.ts$/, "");
      const mod = await import(`@/${file}`);
      const configMod = await import(`@/${dir}/config`);
      const config = Object.values(configMod).find(
        (value) =>
          value !== null && typeof value === "object" && "controls" in value,
      ) as {
        durationInFrames: number;
        controls: Record<string, { default?: unknown }>;
        lists?: Record<string, { default: unknown }>;
      };
      const props = Object.freeze({
        ...Object.fromEntries(
          Object.entries(config.controls).map(([k, c]) => [k, c.default]),
        ),
        ...Object.fromEntries(
          Object.entries(config.lists ?? {}).map(([k, l]) => [k, l.default]),
        ),
      });
      const schedules = Object.entries(mod).filter(
        ([name, value]) =>
          name.endsWith("Timeline") && typeof value === "function",
      ) as [string, (p: unknown, s: { length: number }) => unknown[]][];
      if (schedules.length !== 1) {
        problems.push(`${file}: ${schedules.length} exported *Timeline`);
        continue;
      }
      const [, schedule] = schedules[0];
      for (const length of [
        config.durationInFrames,
        config.durationInFrames / 2,
      ]) {
        const scene = { length };
        const first = schedule(props, scene) as {
          id: string;
          start: number;
          length: number;
          follows?: string;
          beats?: Record<string, number>;
        }[];
        const label = `${file} @${length}`;
        if (JSON.stringify(schedule(props, scene)) !== JSON.stringify(first))
          problems.push(`${label}: two calls disagree`);
        if (first.length === 0) problems.push(`${label}: no elements`);
        const ids = first.map((e) => e.id);
        if (new Set(ids).size !== ids.length)
          problems.push(`${label}: duplicate ids ${ids.join(", ")}`);
        first.forEach((e, i) => {
          const numbers = [e.start, e.length, ...Object.values(e.beats ?? {})];
          if (!numbers.every(Number.isFinite))
            problems.push(`${label}: ${e.id} has a non-finite number`);
          if (e.length < 0) problems.push(`${label}: ${e.id} has length < 0`);
          if (i > 0 && e.start < first[i - 1].start)
            problems.push(`${label}: ${e.id} starts before ${first[i - 1].id}`);
          if (e.follows && !ids.slice(0, i).includes(e.follows))
            problems.push(
              `${label}: ${e.id} follows ${e.follows}, not earlier`,
            );
        });
      }
    }

    expect(problems).toEqual([]);
  });
});

describe("the transitions library page stays complete", () => {
  // /docs/transitions answers "is there a transitions library for Remotion?"
  // with a count and a table of every transition. A new transition page has
  // to land in that table, and the count in the title has to follow.
  const index = readFileSync("content/docs/transitions/index.mdx", "utf8");
  const transitions = pages
    .filter(
      (page) =>
        page.file.startsWith("content/docs/transitions/") &&
        typeof page.frontmatter.component === "string",
    )
    .map((page) => basename(page.file, ".mdx"))
    .sort();

  it("lists every transition page in a table row", () => {
    const rows = [
      ...index.matchAll(
        /^\| \[[^\]]+\]\(\/docs\/transitions\/([a-z0-9-]+)\)/gm,
      ),
    ].map((match) => match[1]);

    expect([...rows].sort()).toEqual(transitions);
  });

  it("states the real count in its title and description", () => {
    const pageMeta = pages.find(
      (page) => page.file === "content/docs/transitions/index.mdx",
    )?.frontmatter;

    expect(String(pageMeta?.title)).toContain(
      `${transitions.length} ready-made`,
    );
    expect(String(pageMeta?.description)).toStartWith(`${transitions.length} `);
  });
});

describe("stated text effect counts match the docs", () => {
  const countIn = (section: string) =>
    pages.filter(
      (p) =>
        p.file.startsWith(`content/docs/${section}/`) &&
        typeof p.frontmatter.component === "string",
    ).length;
  const STATED = [
    "content/docs/typography/index.mdx",
    "content/docs/guides/remotion-text-animations.mdx",
  ];

  it("states the real number of typography and caption components", () => {
    const text = countIn("typography");
    const captions = countIn("captions");
    const wrong: string[] = [];
    for (const file of STATED) {
      const src = readFileSync(file, "utf8");
      for (const [, n] of src.matchAll(
        /\b(\d+) (?:[\w-]+,? ){0,3}(?:animated text effects|text animation components)/g,
      )) {
        if (Number(n) !== text) wrong.push(`${file}: ${n} text, real ${text}`);
      }
      for (const [, n] of src.matchAll(/\b(\d+) (?:[\w-]+ )?caption styles/g)) {
        if (Number(n) !== captions)
          wrong.push(`${file}: ${n} captions, real ${captions}`);
      }
    }

    expect(wrong).toEqual([]);
  });
});

describe("lastModified matches the page's own date", () => {
  // The sitemap's lastmod and the article's dateModified come from the
  // frontmatter; the reader sees the "Last updated" line. Edit one, edit both.
  it("agrees with the _Last updated_ line", () => {
    const wrong: string[] = [];
    for (const page of pages) {
      const stated = page.frontmatter.lastModified;
      if (stated === undefined) continue;
      const iso = new Date(stated as string | Date).toISOString().slice(0, 10);
      const line = /_Last updated: ([A-Z][a-z]+ \d{1,2}, \d{4})\./.exec(
        readFileSync(page.file, "utf8"),
      );
      if (!line) continue;
      const shown = new Date(`${line[1]} UTC`).toISOString().slice(0, 10);
      if (shown !== iso)
        wrong.push(`${page.file}: lastModified ${iso}, page says ${shown}`);
    }

    expect(wrong).toEqual([]);
  });
});

describe("stated catalog size matches the registry", () => {
  const STATED = [
    "content/docs/getting-started/introduction.mdx",
    "content/docs/guides/after-effects-alternatives-for-developers.mdx",
    "content/docs/guides/remotion-mcp-servers.mdx",
    "content/docs/guides/hyperframes-alternatives.mdx",
    "content/docs/guides/remotion-component-libraries.mdx",
    "README.md",
  ];

  it("states the real number of installable components", async () => {
    const { COMPONENT_COUNT } = await import("@/config/site");
    const wrong: string[] = [];
    for (const file of STATED) {
      const src = readFileSync(file, "utf8");
      for (const [, n] of src.matchAll(
        /\b(\d{3,}) (?:free, )?(?:MIT-licensed (?:Remotion )?components|components,? all MIT|MIT-licensed components)/g,
      )) {
        if (Number(n) !== COMPONENT_COUNT)
          wrong.push(`${file}: ${n}, real ${COMPONENT_COUNT}`);
      }
    }

    expect(wrong).toEqual([]);
  });
});
