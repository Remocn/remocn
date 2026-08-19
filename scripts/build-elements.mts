import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { createElementPayload } from "@remotion/studio-protocol";
import { Glob } from "bun";
import { previewManifest } from "../registry/__manifest__";

const ARTIFACTS_DIR = "registry-artifacts";
const ELEMENTS_DIR = join(ARTIFACTS_DIR, "elements");

const INLINABLE_LIBS: Record<string, { artifact: string; importPath: string }> =
  {
    "@remocn/icons-core": {
      artifact: "icons-core",
      importPath: "@/lib/remocn-icons",
    },
    "@remocn/canvas-presentation": {
      artifact: "canvas-presentation",
      importPath: "@/lib/remocn/canvas-presentation",
    },
  };

interface RegistryItem {
  name: string;
  title?: string;
  description?: string;
  type: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: { path: string; content: string; type: string }[];
}

function readItem(name: string): RegistryItem {
  return JSON.parse(readFileSync(join(ARTIFACTS_DIR, `${name}.json`), "utf8"));
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const pinnedVersions: Record<string, string> = {
  ...pkg.devDependencies,
  ...pkg.dependencies,
};

function resolveDependencies(names: Set<string>) {
  return [...names]
    .filter((name) => name !== "remotion")
    .map((name) => {
      if (name.startsWith("@remotion/")) {
        return { name, version: null };
      }
      const raw = pinnedVersions[name];
      if (!raw) {
        throw new Error(
          `No pinned version for dependency "${name}" in package.json`,
        );
      }
      return { name, version: raw.replace(/^[\^~]/, "") };
    });
}

function loadFrontmatterLengths(): Record<string, number> {
  const lengths: Record<string, number> = {};
  const glob = new Glob("content/docs/**/*.mdx");
  for (const file of glob.scanSync(".")) {
    const text = readFileSync(file, "utf8");
    const match = text.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;
    const fm = match[1];
    const component = fm.match(/^component:\s*(\S+)\s*$/m)?.[1];
    const length = fm.match(/^length:\s*(\d+)\s*$/m)?.[1];
    if (component && length) {
      lengths[component] = Number(length);
    }
  }
  return lengths;
}

interface ParsedSource {
  imports: Map<string, { named: Set<string>; typeNamed: Set<string> }>;
  body: string;
}

function parseSource(source: string): ParsedSource {
  const imports: ParsedSource["imports"] = new Map();
  const importRe =
    /^import\s+(type\s+)?\{([\s\S]*?)\}\s+from\s+"([^"]+)";?\s*$/gm;
  const body = source
    .replace(/^"use client";\s*/m, "")
    .replace(
      importRe,
      (_, typeOnly: string | undefined, specifiers: string, module: string) => {
        let entry = imports.get(module);
        if (!entry) {
          entry = { named: new Set(), typeNamed: new Set() };
          imports.set(module, entry);
        }
        for (const spec of specifiers.split(",")) {
          const trimmed = spec.trim();
          if (!trimmed) continue;
          if (typeOnly || trimmed.startsWith("type ")) {
            entry.typeNamed.add(trimmed.replace(/^type\s+/, ""));
          } else {
            entry.named.add(trimmed);
          }
        }
        return "";
      },
    )
    .trim();
  return { imports, body };
}

function stripExports(body: string): string {
  return body.replace(
    /^export\s+(?=(function|const|class|interface|type|let)\b)/gm,
    "",
  );
}

function mergeSources(component: ParsedSource, libs: ParsedSource[]): string {
  const merged: ParsedSource["imports"] = new Map();
  for (const source of [component, ...libs]) {
    for (const [module, entry] of source.imports) {
      if (
        Object.values(INLINABLE_LIBS).some((lib) => lib.importPath === module)
      )
        continue;
      let target = merged.get(module);
      if (!target) {
        target = { named: new Set(), typeNamed: new Set() };
        merged.set(module, target);
      }
      for (const spec of entry.named) target.named.add(spec);
      for (const spec of entry.typeNamed) {
        target.typeNamed.add(spec);
      }
    }
  }
  const importLines = [...merged.entries()].map(([module, entry]) => {
    const specs = [
      ...[...entry.named].sort(),
      ...[...entry.typeNamed]
        .sort()
        .filter((spec) => !entry.named.has(spec))
        .map((spec) => `type ${spec}`),
    ];
    return `import { ${specs.join(", ")} } from "${module}";`;
  });
  const libBodies = libs.map((lib) => stripExports(lib.body));
  return [importLines.join("\n"), ...libBodies, component.body].join("\n\n");
}

function countExportedComponents(source: string): string[] {
  return [
    ...new Set(
      [
        ...source.matchAll(
          /export\s+(?:const|function)\s+([A-Z_$][A-Za-z0-9_$]*)\b/g,
        ),
      ].map((m) => m[1]),
    ),
  ];
}

const frontmatterLengths = loadFrontmatterLengths();
const libSources = new Map(
  Object.entries(INLINABLE_LIBS).map(([dep, { artifact }]) => {
    const item = readItem(artifact);
    return [
      dep,
      {
        parsed: parseSource(item.files[0].content),
        dependencies: item.dependencies ?? [],
      },
    ];
  }),
);

rmSync(ELEMENTS_DIR, { recursive: true, force: true });
mkdirSync(ELEMENTS_DIR, { recursive: true });

let built = 0;
const skipped: string[] = [];

for (const file of readdirSync(ARTIFACTS_DIR).sort()) {
  if (!file.endsWith(".json")) continue;
  const item = readItem(file.replace(/\.json$/, ""));
  if (item.type !== "registry:component") continue;
  if (!item.files || item.files.length !== 1) continue;
  const path = item.files[0].path;
  if (
    !path.startsWith("registry/remocn/") &&
    !path.startsWith("registry/remocn-icons/")
  )
    continue;
  const regDeps = item.registryDependencies ?? [];
  if (!regDeps.every((dep) => dep in INLINABLE_LIBS)) {
    skipped.push(`${item.name} (registry deps: ${regDeps.join(", ")})`);
    continue;
  }
  const durationInFrames =
    frontmatterLengths[item.name] ??
    previewManifest[item.name]?.durationInFrames;
  if (!durationInFrames) {
    skipped.push(`${item.name} (no duration source)`);
    continue;
  }

  const libs = regDeps.flatMap((dep) => {
    const lib = libSources.get(dep);
    return lib ? [lib] : [];
  });
  let sourceCode = mergeSources(
    parseSource(item.files[0].content),
    libs.map((lib) => lib.parsed),
  );
  let exported = countExportedComponents(sourceCode);
  if (exported.length === 2) {
    const staticName = exported.find(
      (name) => name === `${exported.find((n) => n !== name)}Static`,
    );
    if (staticName) {
      sourceCode = sourceCode.replace(
        new RegExp(
          `^export\\s+(?=(?:const|function)\\s+${staticName}\\b)`,
          "m",
        ),
        "",
      );
      exported = countExportedComponents(sourceCode);
    }
  }
  if (exported.length !== 1) {
    skipped.push(`${item.name} (${exported.length} exported components)`);
    continue;
  }
  const depNames = new Set([
    ...(item.dependencies ?? []),
    ...libs.flatMap((lib) => lib.dependencies),
  ]);

  const payload = createElementPayload({
    displayName: item.title ?? item.name,
    slug: item.name,
    sourceCode,
    dependencies: resolveDependencies(depNames),
    dimensions: null,
    durationInFrames,
    installationMode: "wrapped",
  });

  writeFileSync(
    join(ELEMENTS_DIR, `${item.name}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
  built++;
}

console.log(`Built ${built} element payloads into ${ELEMENTS_DIR}`);
console.log(`Skipped ${skipped.length} incompatible items`);
for (const s of skipped) console.log("  -", s);
