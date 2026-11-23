import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createElementPayload } from "@remotion/studio-protocol";
import { Glob } from "bun";
import type { InteractivitySchema } from "remotion";
import { resolveSchema } from "../lib/customizer-config";
import { previewManifest } from "../registry/__manifest__";

const ARTIFACTS_DIR = "registry-artifacts";
/** The frame rate an element's clip length is written for. */
const ELEMENT_FPS = 60;
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
    "@remocn/caption-core": {
      artifact: "caption-core",
      importPath: "@/lib/remocn/caption-core",
    },
    "@remocn/audit-core": {
      artifact: "audit-core",
      importPath: "@/lib/remocn/audit-core",
    },
    "@remocn/glide": {
      artifact: "glide",
      importPath: "@/lib/remocn/glide",
    },
    "@remocn/frame-rate": {
      artifact: "frame-rate",
      importPath: "@/lib/remocn/frame-rate",
    },
    "@remocn/timeline": {
      artifact: "timeline",
      importPath: "@/lib/remocn/timeline",
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
        return { name: name as `@remotion/${string}`, version: null };
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
  imports: Map<
    string,
    { named: Set<string>; typeNamed: Set<string>; defaults: Set<string> }
  >;
  body: string;
}

function getImportEntry(imports: ParsedSource["imports"], module: string) {
  let entry = imports.get(module);
  if (!entry) {
    entry = { named: new Set(), typeNamed: new Set(), defaults: new Set() };
    imports.set(module, entry);
  }
  return entry;
}

function parseSource(source: string): ParsedSource {
  const imports: ParsedSource["imports"] = new Map();
  const importRe =
    /^import\s+(type\s+)?(?:([A-Za-z_$][\w$]*)\s*,\s*)?\{([\s\S]*?)\}\s+from\s+"([^"]+)";?\s*$/gm;
  const defaultImportRe =
    /^import\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s+from\s+"([^"]+)";?\s*$/gm;
  const body = source
    .replace(/^"use client";\s*/m, "")
    .replace(
      importRe,
      (
        _,
        typeOnly: string | undefined,
        defaultName: string | undefined,
        specifiers: string,
        module: string,
      ) => {
        const entry = getImportEntry(imports, module);
        if (defaultName) entry.defaults.add(defaultName);
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
    .replace(defaultImportRe, (_, defaultName: string, module: string) => {
      getImportEntry(imports, module).defaults.add(defaultName);
      return "";
    })
    .trim();
  return { imports, body };
}

function stripExports(body: string): string {
  return body.replace(
    /^export\s+(?=(function|const|class|interface|type|let)\b)/gm,
    "",
  );
}

const WRAPPER_IMPORTS: ParsedSource["imports"] = new Map([
  [
    "react",
    {
      named: new Set(["forwardRef", "useImperativeHandle", "useRef"]),
      typeNamed: new Set(["ComponentProps"]),
      defaults: new Set<string>(),
    },
  ],
  [
    "remotion",
    {
      named: new Set(["Interactive", "Sequence"]),
      typeNamed: new Set([
        "InteractiveBaseProps",
        "InteractiveTransformProps",
        "InteractivitySchema",
        "SequenceControls",
      ]),
      defaults: new Set<string>(),
    },
  ],
]);

function mergeSources(
  component: ParsedSource,
  libs: ParsedSource[],
  extra: ParsedSource["imports"] = new Map(),
): string {
  const merged: ParsedSource["imports"] = new Map();
  for (const source of [component, ...libs, { imports: extra, body: "" }]) {
    for (const [module, entry] of source.imports) {
      if (
        module.startsWith("./") ||
        Object.values(INLINABLE_LIBS).some((lib) => lib.importPath === module)
      )
        continue;
      const target = getImportEntry(merged, module);
      for (const spec of entry.named) target.named.add(spec);
      for (const spec of entry.typeNamed) {
        target.typeNamed.add(spec);
      }
      for (const spec of entry.defaults) target.defaults.add(spec);
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
    const defaultName = [...entry.defaults][0];
    if (defaultName && specs.length > 0) {
      return `import ${defaultName}, { ${specs.join(", ")} } from "${module}";`;
    }
    if (defaultName) return `import ${defaultName} from "${module}";`;
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

const RESERVED_SCHEMA_KEYS = new Set([
  "name",
  "style",
  "from",
  "durationInFrames",
  "trimBefore",
  "freeze",
  "hidden",
  "showInTimeline",
  "premountFor",
  "controls",
]);

const IDENT = /^[A-Za-z_$][\w$]*$/;

function serializeSchema(value: unknown, indent: string): string {
  if (value === null) return "null";
  // A colour with no default is auto: the component takes it from its theme.
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => serializeSchema(v, indent)).join(", ")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return "{}";
  const inner = `${indent}  `;
  const lines = entries.map(([k, v]) => {
    const key = IDENT.test(k) ? k : JSON.stringify(k);
    return `${inner}${key}: ${serializeSchema(v, inner)},`;
  });
  return `{\n${lines.join("\n")}\n${indent}}`;
}

interface ElementConfig {
  schema: InteractivitySchema | null;
  dimensions: { width: number; height: number } | null;
}

async function loadElementConfig(
  name: string,
  sourcePath: string,
): Promise<ElementConfig> {
  const configPath = join(dirname(sourcePath), "config.ts");
  if (!existsSync(configPath)) return { schema: null, dimensions: null };
  const mod = await import(resolve(configPath));
  const config = Object.values(mod).find(
    (v) => v && typeof v === "object" && "controls" in (v as object),
  ) as
    | {
        controls: InteractivitySchema;
        dimensions?: { width: number; height: number };
      }
    | undefined;
  if (!config) return { schema: null, dimensions: null };
  const dimensions = config.dimensions ?? null;
  const schema = resolveSchema(name, config.controls);
  if (Object.keys(schema).some((key) => RESERVED_SCHEMA_KEYS.has(key))) {
    return { schema: null, dimensions };
  }
  return { schema, dimensions };
}

function makeInteractiveWrapper(
  componentName: string,
  schema: InteractivitySchema,
  dimensions: { width: number; height: number } | null,
): string {
  const keys = Object.keys(schema);
  const sizeControls =
    dimensions !== null && !("width" in schema) && !("height" in schema);
  const sizeSchema = sizeControls
    ? `  width: {
    type: "number",
    default: ${dimensions?.width},
    min: 10,
    step: 10,
    description: "Width",
  },
  height: {
    type: "number",
    default: ${dimensions?.height},
    min: 10,
    step: 10,
    description: "Height",
  },
`
    : "";
  const content = dimensions
    ? `<div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          ref={outlineRef}
          style={{
            position: "relative",
            width${sizeControls ? "" : `: ${dimensions.width}`},
            height${sizeControls ? "" : `: ${dimensions.height}`},
            ...style,
          }}
        >
          <${componentName}Base
            {...(componentProps as unknown as ComponentProps<typeof ${componentName}Base>)}
          />
        </div>
      </div>`
    : `<div
        ref={outlineRef}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        }}
      >
        <${componentName}Base
          {...(componentProps as unknown as ComponentProps<typeof ${componentName}Base>)}
        />
      </div>`;
  return `const elementSchema = {
  ...Interactive.baseSchema,
${Object.entries(schema)
  .map(
    ([k, v]) =>
      `  ${IDENT.test(k) ? k : JSON.stringify(k)}: ${serializeSchema(v, "  ")},`,
  )
  .join("\n")}
${sizeSchema}  ...Interactive.transformSchema,
} as const satisfies InteractivitySchema;

const ELEMENT_PROP_KEYS = new Set(${JSON.stringify(keys)});

const ELEMENT_PROP_DEFAULTS: Record<string, unknown> = ${serializeSchema(
    Object.fromEntries(
      Object.entries(schema).flatMap(([k, v]) =>
        "default" in v && v.default !== undefined && v.default !== null
          ? [[k, v.default]]
          : [],
      ),
    ),
    "",
  )};

type ${componentName}ElementProps = InteractiveBaseProps &
  InteractiveTransformProps &${
    sizeControls
      ? ` { readonly width?: number; readonly height?: number } &`
      : ""
  }
  ComponentProps<typeof ${componentName}Base>;

const ${componentName}Inner = forwardRef<
  HTMLDivElement,
  ${componentName}ElementProps & { readonly controls: SequenceControls | undefined }
>(({ controls, name, style, ${
    sizeControls
      ? `width = ${dimensions?.width}, height = ${dimensions?.height}, `
      : ""
  }...rest }, ref) => {
  const outlineRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => outlineRef.current as HTMLDivElement, []);
  const componentProps: Record<string, unknown> = { ...ELEMENT_PROP_DEFAULTS };
  const sequenceProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (ELEMENT_PROP_KEYS.has(key)) {
      if (value !== undefined) componentProps[key] = value;
    } else {
      sequenceProps[key] = value;
    }
  }
  return (
    <Sequence
      layout="none"
      {...sequenceProps}
      controls={controls}
      name={name ?? "<${componentName}>"}
      outlineRef={outlineRef}
    >
      ${content}
    </Sequence>
  );
});

export const ${componentName} = Interactive.withSchema({
  Component: ${componentName}Inner,
  componentName: "<${componentName}>",
  componentIdentity: null,
  schema: elementSchema,
  supportsEffects: false,
});`;
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
        registryDependencies: item.registryDependencies ?? [],
      },
    ];
  }),
);

rmSync(ELEMENTS_DIR, { recursive: true, force: true });
mkdirSync(ELEMENTS_DIR, { recursive: true });

let built = 0;
let interactive = 0;
const skipped: string[] = [];

for (const file of readdirSync(ARTIFACTS_DIR).sort()) {
  if (!file.endsWith(".json")) continue;
  const item = readItem(file.replace(/\.json$/, ""));
  if (item.type !== "registry:component") continue;
  if (!item.files || item.files.length === 0) continue;
  // A component may carry modules of its own beside it (`timeline.ts`),
  // imported relatively; they are inlined ahead of it like the libs.
  const [main, ...ownModules] = item.files;
  const path = main.path;
  if (
    !path.startsWith("registry/remocn/") &&
    !path.startsWith("registry/remocn-icons/")
  )
    continue;
  const component = parseSource(main.content);
  const ownsSequence =
    /^export\s+const\s+[\w$]+\s*=\s*Interactive\.create\(/m.test(
      component.body,
    );
  const registryDependencies = new Set(item.registryDependencies);
  if (ownsSequence) {
    for (const dep of registryDependencies) {
      for (const nested of libSources.get(dep)?.registryDependencies ?? []) {
        registryDependencies.add(nested);
      }
    }
  }
  const regDeps = [...registryDependencies];
  if (!regDeps.every((dep) => dep in INLINABLE_LIBS)) {
    skipped.push(`${item.name} (registry deps: ${regDeps.join(", ")})`);
    continue;
  }
  const ownFrames =
    frontmatterLengths[item.name] ??
    previewManifest[item.name]?.durationInFrames;
  if (!ownFrames) {
    skipped.push(`${item.name} (no duration source)`);
    continue;
  }
  // Studio makes the clip this many frames of the composition it lands in,
  // whatever that composition's rate, and the element counts its own timing
  // at 30 fps. Sized for the 60 fps the docs write compositions at: there the
  // clip covers the motion exactly, and at 30 fps it holds the last frame
  // longer. Sized for 30, a 60 fps composition would cut the motion in half.
  // A docs `length` is always 30 fps frames; a config carries its own rate.
  const ownFps = frontmatterLengths[item.name]
    ? 30
    : (previewManifest[item.name]?.fps ?? 30);
  const durationInFrames = Math.round((ownFrames * ELEMENT_FPS) / ownFps);

  const libs = [
    ...regDeps.flatMap((dep) => {
      const lib = libSources.get(dep);
      return lib ? [lib] : [];
    }),
    ...ownModules.map((file) => ({
      parsed: parseSource(file.content),
      dependencies: [] as string[],
      registryDependencies: [] as string[],
    })),
  ];
  const { schema, dimensions } = await loadElementConfig(item.name, path);
  let sourceCode = mergeSources(
    component,
    libs.map((lib) => lib.parsed),
    schema && !ownsSequence ? WRAPPER_IMPORTS : undefined,
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
  if (schema && !ownsSequence) {
    const componentName = exported[0];
    sourceCode = stripExports(
      sourceCode.replace(
        new RegExp(`\\b${componentName}\\b`, "g"),
        `${componentName}Base`,
      ),
    );
    sourceCode += `\n\n${makeInteractiveWrapper(componentName, schema, dimensions)}\n`;
  }

  const installationMode =
    ownsSequence || schema ? "component-owned-sequence" : "wrapped";
  if (installationMode === "component-owned-sequence") interactive++;

  const depNames = new Set([
    ...(item.dependencies ?? []),
    ...libs.flatMap((lib) => lib.dependencies),
  ]);
  const captionField = schema?.captions;
  const initialProps =
    ownsSequence &&
    captionField?.type === "remotion-captions" &&
    captionField.default
      ? { captions: captionField.default }
      : null;

  const payload = createElementPayload({
    displayName: item.title ?? item.name,
    slug: item.name,
    sourceCode,
    dependencies: resolveDependencies(depNames),
    dimensions,
    durationInFrames,
    installationMode,
    initialProps,
    ...(regDeps.includes("@remocn/caption-core")
      ? { isCaptionStyle: true }
      : {}),
  });

  writeFileSync(
    join(ELEMENTS_DIR, `${item.name}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
  );
  built++;
}

console.log(
  `Built ${built} element payloads into ${ELEMENTS_DIR} (${interactive} interactive)`,
);
console.log(`Skipped ${skipped.length} incompatible items`);
for (const s of skipped) console.log("  -", s);
