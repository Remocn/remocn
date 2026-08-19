import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import registry, { loadComponentConfig } from "@/registry/__index__";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const outRoot = path.join(root, "out", "21st");
const publishRoot = path.join(outRoot, "publish");

const REMOTION_VERSION = "4.0.473";
const rootPkg = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf8"),
);
const versionOf = (dep: string): string => {
  const v = rootPkg.dependencies?.[dep] ?? rootPkg.devDependencies?.[dep];
  if (!v) throw new Error(`Unknown npm dep version for ${dep}`);
  return v;
};

interface ManifestItem {
  name: string;
  type: string;
  title: string;
  description: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: { path: string; type: string }[];
}

const sectionOf = new Map<string, string>();
const docsDir = path.join(root, "content", "docs");
for (const dir of readdirSync(docsDir, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const metaPath = path.join(docsDir, dir.name, "meta.json");
  if (!existsSync(metaPath)) continue;
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  for (const page of meta.pages ?? []) {
    if (typeof page === "string" && page !== "index")
      sectionOf.set(page, dir.name);
  }
}

const TAGS: Record<string, string[]> = {
  typography: ["remotion", "typography", "text-animation", "video"],
  effects: ["remotion", "effect", "animation", "video"],
  transitions: ["remotion", "transition", "animation", "video"],
  shaders: ["remotion", "background", "shader", "video"],
  social: ["remotion", "social", "animation", "video"],
  layout: ["remotion", "layout", "animation", "video"],
  compositions: ["remotion", "scene", "animation", "video"],
  ai: ["remotion", "ai", "animation", "video"],
  "ui-blocks": ["remotion", "ui", "animation", "video"],
  icons: ["remotion", "icon", "lucide", "animation", "video"],
};
const DEFAULT_TAGS = ["remotion", "animation", "video"];

interface ParsedImports {
  named: Map<string, Set<string>>;
  rest: string[];
}

function splitImports(code: string): { imports: ParsedImports; body: string } {
  const named = new Map<string, Set<string>>();
  const rest: string[] = [];
  const importRe = /import\s+(type\s+)?{([\s\S]*?)}\s+from\s+"([^"]+)";?\n?/g;
  const otherImportRe = /import\s+[^{}\n]*?\s+from\s+"[^"]+";?\n?/g;
  let body = code.replace(/^"use client";\n*/g, "");
  body = body.replace(importRe, (_m, typeOnly, specs: string, mod: string) => {
    if (mod === "@/lib/remocn-icons") return "";
    const set = named.get(mod) ?? new Set<string>();
    for (const raw of specs.split(",")) {
      const spec = raw.trim().replace(/\s+/g, " ");
      if (!spec) continue;
      set.add(typeOnly ? `type ${spec.replace(/^type /, "")}` : spec);
    }
    named.set(mod, set);
    return "";
  });
  body = body.replace(otherImportRe, (m) => {
    rest.push(m.trim());
    return "";
  });
  return { imports: { named, rest }, body: body.replace(/^\n+/, "") };
}

function mergeIconWithCore(iconCode: string, coreCode: string): string {
  const icon = splitImports(iconCode);
  const core = splitImports(coreCode);
  const named = new Map<string, Set<string>>();
  for (const src of [core.imports.named, icon.imports.named]) {
    for (const [mod, specs] of src) {
      const set = named.get(mod) ?? new Set<string>();
      for (const s of specs) {
        if (set.has(s.replace(/^type /, ""))) continue;
        if (s.startsWith("type ") || !set.has(`type ${s}`)) set.add(s);
        if (!s.startsWith("type ") && set.has(`type ${s}`)) {
          set.delete(`type ${s}`);
          set.add(s);
        }
      }
      named.set(mod, set);
    }
  }
  const importLines = [...named.entries()].map(
    ([mod, specs]) =>
      `import { ${[...specs].sort().join(", ")} } from "${mod}";`,
  );
  const rest = [...new Set([...core.imports.rest, ...icon.imports.rest])];
  return `"use client";\n\n${[...importLines, ...rest].join("\n")}\n\n${core.body}\n${icon.body}`;
}

function demoSource(opts: {
  slug: string;
  exportName: string;
  props: Record<string, unknown>;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  background: string;
}): string {
  const {
    slug,
    exportName,
    props,
    width,
    height,
    fps,
    durationInFrames,
    background,
  } = opts;
  const initialFrame = Math.min(
    Math.floor(durationInFrames * 0.66),
    durationInFrames - 1,
  );
  const propsLiteral = JSON.stringify(props, null, 2).replace(
    /"([A-Za-z_$][A-Za-z0-9_$]*)":/g,
    "$1:",
  );
  return `"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useEffect, useRef } from "react";
import { ${exportName} } from "./${slug}";

const DEFAULT_PROPS = ${propsLiteral} as const;

function DemoComposition() {
  return <${exportName} {...DEFAULT_PROPS} />;
}

export default function Demo() {
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    let attempts = 0;
    const MAX_ATTEMPTS = 40;
    const id = setInterval(() => {
      const player = playerRef.current;
      if (player && !player.isPlaying()) player.play();
      attempts += 1;
      if (player?.isPlaying() || attempts >= MAX_ATTEMPTS) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, []);

  return (
    <Player
      ref={playerRef}
      component={DemoComposition}
      durationInFrames={${durationInFrames}}
      fps={${fps}}
      compositionWidth={${width}}
      compositionHeight={${height}}
      initialFrame={${initialFrame}}
      controls
      loop
      acknowledgeRemotionLicense
      style={{ width: "100%", background: ${JSON.stringify(background)} }}
    />
  );
}
`;
}

const coreCode = readFileSync(
  path.join(root, "registry", "remocn-icons", "icons-core", "index.ts"),
  "utf8",
);

const skipped: { slug: string; reason: string }[] = [];
const generated: {
  slug: string;
  exportName: string;
  modPath: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  background: string;
  props: Record<string, unknown>;
}[] = [];

const transpiler = new Bun.Transpiler({ loader: "tsx" });

for (const ns of ["remocn", "remocn-icons"] as const) {
  const manifest = JSON.parse(
    readFileSync(path.join(root, "registry", ns, "registry.json"), "utf8"),
  );
  for (const item of manifest.items as ManifestItem[]) {
    if (item.type !== "registry:component") continue;
    const slug = item.name;
    const entry = registry[slug];
    if (!entry) {
      skipped.push({ slug, reason: "no preview entry in __index__" });
      continue;
    }
    const loadSrc = entry.load.toString();
    const modMatch = loadSrc.match(/import\("([^"]+)"\)/);
    const exportMatch = loadSrc.match(/m\.([A-Za-z0-9_$]+)/);
    if (!modMatch || !exportMatch) {
      skipped.push({ slug, reason: "unparseable __index__ load" });
      continue;
    }
    const modPath = modMatch[1];
    const exportName = exportMatch[1];
    if (!modPath.startsWith("@/registry/")) {
      skipped.push({ slug, reason: `site wrapper preview (${modPath})` });
      continue;
    }
    const regDeps = item.registryDependencies ?? [];
    const nonCoreDeps = regDeps.filter((d) => d !== "@remocn/icons-core");
    if (nonCoreDeps.length > 0) {
      skipped.push({
        slug,
        reason: `registry deps: ${nonCoreDeps.join(", ")}`,
      });
      continue;
    }
    const srcFile = path.join(root, "registry", ns, item.files[0].path);
    if (!existsSync(srcFile)) {
      skipped.push({ slug, reason: `source not found: ${item.files[0].path}` });
      continue;
    }

    let code = readFileSync(srcFile, "utf8");
    if (regDeps.includes("@remocn/icons-core")) {
      code = mergeIconWithCore(code, coreCode);
    }
    if (code.includes("@/")) {
      skipped.push({ slug, reason: "unresolved @/ import after transform" });
      continue;
    }

    const config = await loadComponentConfig(slug);
    const backdrop = config.previewBackdrop;
    const background =
      backdrop && (backdrop.type === "color" || backdrop.type === "gradient")
        ? backdrop.value
        : "#ffffff";
    const props: Record<string, unknown> = {};
    for (const [key, ctrl] of Object.entries(config.controls)) {
      const numericSelect =
        ctrl.type === "select" &&
        /^\d+(\.\d+)?$/.test(ctrl.default) &&
        ctrl.options.every((o) => /^\d+(\.\d+)?$/.test(o));
      props[key] = numericSelect ? Number(ctrl.default) : ctrl.default;
    }
    const isIcon = regDeps.includes("@remocn/icons-core");
    let width = config.compositionWidth;
    let height = config.compositionHeight;
    if (isIcon && "size" in config.controls) {
      width = 480;
      height = 480;
      props.size = 480;
    }
    const demo = demoSource({
      slug,
      exportName,
      props,
      width,
      height,
      fps: config.fps,
      durationInFrames: config.durationInFrames,
      background,
    });

    try {
      transpiler.transformSync(code);
      transpiler.transformSync(demo);
    } catch (err) {
      skipped.push({
        slug,
        reason: `transpile failed: ${String(err).slice(0, 120)}`,
      });
      continue;
    }

    const importedPkgs = new Set<string>(item.dependencies ?? []);
    for (const m of code.matchAll(
      /(?:from\s+|import\s*\(\s*)"([^".@/][^"]*|@[^"]+)"/g,
    )) {
      const spec = m[1];
      if (spec.startsWith("@/") || spec.startsWith(".")) continue;
      const parts = spec.split("/");
      importedPkgs.add(
        spec.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0],
      );
    }
    importedPkgs.delete("react");
    importedPkgs.delete("react-dom");
    const npmDeps: Record<string, string> = {
      "@remotion/player": REMOTION_VERSION,
    };
    let missingDep: string | null = null;
    for (const dep of importedPkgs) {
      try {
        npmDeps[dep] =
          dep.startsWith("@remotion/") || dep === "remotion"
            ? REMOTION_VERSION
            : versionOf(dep);
      } catch {
        missingDep = dep;
        break;
      }
    }
    if (missingDep) {
      skipped.push({ slug, reason: `unknown npm dep: ${missingDep}` });
      continue;
    }

    const dir = path.join(publishRoot, slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, `${slug}.tsx`), code);
    writeFileSync(path.join(dir, "demo.tsx"), demo);
    writeFileSync(
      path.join(dir, "package.json"),
      `${JSON.stringify({ name: `remocn-21st-${slug}`, private: true, dependencies: npmDeps }, null, 2)}\n`,
    );
    writeFileSync(
      path.join(dir, "meta.json"),
      `${JSON.stringify(
        {
          name: item.title,
          slug,
          description: item.description,
          tags: (
            TAGS[
              sectionOf.get(slug) ?? (ns === "remocn-icons" ? "icons" : "")
            ] ?? DEFAULT_TAGS
          ).slice(0, 5),
        },
        null,
        2,
      )}\n`,
    );
    generated.push({
      slug,
      exportName,
      modPath,
      width,
      height,
      fps: config.fps,
      durationInFrames: config.durationInFrames,
      background,
      props,
    });
  }
}

const coverImports = generated
  .map(
    (g) =>
      `import { ${g.exportName} as C_${g.slug.replace(/-/g, "_")} } from "${g.modPath}";`,
  )
  .join("\n");
const coverComps = generated
  .map((g) => {
    const comp = `C_${g.slug.replace(/-/g, "_")}`;
    return `      <Composition
        id="${g.slug}"
        component={makeStage(${comp}, ${JSON.stringify(g.background)}, PROPS[${JSON.stringify(g.slug)}])}
        durationInFrames={${g.durationInFrames}}
        fps={${g.fps}}
        width={${g.width}}
        height={${g.height}}
      />`;
  })
  .join("\n");
const coverProps: Record<string, unknown> = {};
for (const g of generated) {
  coverProps[g.slug] = g.props;
}

writeFileSync(
  path.join(outRoot, "covers-root.tsx"),
  `import { loadFont } from "@remotion/google-fonts/Geist";
import type { ComponentType } from "react";
import { AbsoluteFill, Composition, registerRoot } from "remotion";
${coverImports}

const { fontFamily: GEIST } = loadFont();
const PROPS: Record<string, Record<string, unknown>> = ${JSON.stringify(coverProps, null, 2)};

function makeStage(Comp: ComponentType<any>, background: string, props: Record<string, unknown>) {
  return function Stage() {
    return (
      <AbsoluteFill
        style={{
          background,
          ["--font-geist-sans" as string]: GEIST,
          fontFamily: GEIST,
        }}
      >
        <Comp {...props} />
      </AbsoluteFill>
    );
  };
}

export function CoversRoot() {
  return (
    <>
${coverComps}
    </>
  );
}

registerRoot(CoversRoot);
`,
);

writeFileSync(
  path.join(outRoot, "generated.json"),
  `${JSON.stringify({ generated: generated.map((g) => g.slug), skipped }, null, 2)}\n`,
);

console.log(`generated: ${generated.length}`);
console.log(`skipped: ${skipped.length}`);
for (const s of skipped) console.log(`  ${s.slug}: ${s.reason}`);
