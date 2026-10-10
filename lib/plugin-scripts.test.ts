import { afterEach, describe, expect, it } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The plugin ships two Node scripts that edit a user's Remotion project. They
// run on machines we never see, so their edits are pinned here.

const SKILLS = join(import.meta.dir, "..", "plugins", "remocn", "skills");
const STUDIO = join(SKILLS, "studio", "scripts", "studio.mjs");
const SETUP = join(SKILLS, "video", "scripts", "setup.mjs");
const REGISTRY = join(SKILLS, "studio", "assets", "registry.tsx");

const ENTRY = `import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
`;

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0))
    rmSync(dir, { force: true, recursive: true });
});

function project(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "remocn-plugin-"));
  dirs.push(dir);
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(join(dir, file, ".."), { recursive: true });
    writeFileSync(join(dir, file), content);
  }
  return dir;
}

function run(script: string, args: string[]) {
  const result = Bun.spawnSync(["node", script, ...args]);
  return {
    exitCode: result.exitCode,
    json: JSON.parse(result.stdout.toString()),
  };
}

const remotionPackage = JSON.stringify({
  name: "launch-video",
  dependencies: { remotion: "4.0.534" },
});

describe("studio.mjs init", () => {
  it("writes the manifest, places the scan and wraps the entry point", () => {
    const dir = project({
      "package.json": remotionPackage,
      "src/index.ts": ENTRY,
    });

    const { json } = run(STUDIO, ["init", dir, "--name", "Launch video"]);

    expect(json.ok).toBe(true);
    const manifest = JSON.parse(
      readFileSync(join(dir, ".remocn/project.json"), "utf8"),
    );
    expect(manifest).toEqual({
      schemaVersion: 1,
      projectId: expect.any(String),
      name: "Launch video",
      revision: 0,
      brand: null,
    });
    expect(readFileSync(join(dir, "src/videos/registry.tsx"), "utf8")).toBe(
      readFileSync(REGISTRY, "utf8"),
    );
    expect(readFileSync(join(dir, "src/index.ts"), "utf8")).toBe(
      `import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
import { withVideos } from "./videos/registry";

registerRoot(withVideos(RemotionRoot));
`,
    );
  });

  it("is idempotent and never replaces a project's identity", () => {
    const dir = project({
      "package.json": remotionPackage,
      "src/index.ts": ENTRY,
    });
    const first = run(STUDIO, ["init", dir]).json;
    const entry = readFileSync(join(dir, "src/index.ts"), "utf8");

    const second = run(STUDIO, ["init", dir]).json;

    expect(second.manifest.written).toBe(false);
    expect(second.manifest.projectId).toBe(first.manifest.projectId);
    expect(second.registry.wrapped).toBe(false);
    expect(readFileSync(join(dir, "src/index.ts"), "utf8")).toBe(entry);
  });

  it("names the project after package.json when no name is given", () => {
    const dir = project({
      "package.json": remotionPackage,
      "src/index.ts": ENTRY,
    });
    run(STUDIO, ["init", dir]);
    const manifest = JSON.parse(
      readFileSync(join(dir, ".remocn/project.json"), "utf8"),
    );
    expect(manifest.name).toBe("launch-video");
  });

  it("refuses an entry point it cannot read instead of guessing", () => {
    const source = `import { registerRoot } from "remotion";\nregisterRoot(() => null);\n`;
    const dir = project({
      "package.json": remotionPackage,
      "src/index.ts": source,
    });

    const { json } = run(STUDIO, ["init", dir]);

    expect(json.ok).toBe(false);
    expect(json.registry.reason).toContain("registerRoot(Root)");
    expect(readFileSync(join(dir, "src/index.ts"), "utf8")).toBe(source);
  });

  it("ignores registerRoot in comments and keeps multi-line imports whole", () => {
    const source = `// Previously: registerRoot(OldRoot);
import { registerRoot } from "remotion";
import {
  RemotionRoot,
} from "./Root";

/* registerRoot(Draft) */
registerRoot(RemotionRoot);
`;
    const dir = project({
      "package.json": remotionPackage,
      "src/index.ts": source,
    });

    const { json } = run(STUDIO, ["init", dir]);

    expect(json.ok).toBe(true);
    expect(readFileSync(join(dir, "src/index.ts"), "utf8")).toBe(
      `// Previously: registerRoot(OldRoot);
import { registerRoot } from "remotion";
import {
  RemotionRoot,
} from "./Root";
import { withVideos } from "./videos/registry";

/* registerRoot(Draft) */
registerRoot(withVideos(RemotionRoot));
`,
    );
  });

  it("points the import at src/videos from an entry outside src", () => {
    const dir = project({
      "package.json": remotionPackage,
      "remotion/index.ts": ENTRY,
    });
    run(STUDIO, ["init", dir]);
    expect(readFileSync(join(dir, "remotion/index.ts"), "utf8")).toContain(
      'import { withVideos } from "../src/videos/registry";',
    );
  });

  it("refuses a folder that is not a project", () => {
    const dir = project({});
    expect(run(STUDIO, ["init", dir]).json.ok).toBe(false);
    expect(existsSync(join(dir, ".remocn"))).toBe(false);
  });
});

describe("studio.mjs open", () => {
  it("asks for init before handing over a folder without a manifest", () => {
    const dir = project({ "package.json": remotionPackage });
    const { json } = run(STUDIO, ["open", dir]);
    expect(json.ok).toBe(false);
    expect(json.reason).toContain("init");
  });
});

describe("setup.mjs", () => {
  const tsconfig = `{
  // Remotion's default
  "compilerOptions": {
    "target": "ES2018",
    "jsx": "react-jsx", /* keep */
    "strict": true,
  },
  "include": ["src"],
  "$schema": "https://json.schemastore.org/tsconfig"
}
`;
  const config = `import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
`;

  it("makes a fresh Remotion project ready for shadcn add", () => {
    const dir = project({
      "package.json": remotionPackage,
      "tsconfig.json": tsconfig,
      "remotion.config.ts": config,
    });

    const { json } = run(SETUP, [dir]);

    expect(json.ok).toBe(true);
    const components = JSON.parse(
      readFileSync(join(dir, "components.json"), "utf8"),
    );
    expect(components.registries["@remocn"]).toBe(
      "https://remocn.dev/r/{name}.json",
    );
    expect(components.aliases.components).toBe("@/components");

    const ts = JSON.parse(readFileSync(join(dir, "tsconfig.json"), "utf8"));
    expect(ts.compilerOptions.paths).toEqual({ "@/*": ["./src/*"] });
    expect(ts.compilerOptions.strict).toBe(true);
    expect(ts.$schema).toBe("https://json.schemastore.org/tsconfig");

    const remotion = readFileSync(join(dir, "remotion.config.ts"), "utf8");
    expect(remotion.startsWith('import path from "node:path";\n')).toBe(true);
    expect(remotion).toContain('Config.setVideoImageFormat("jpeg");');
    expect(remotion).toContain('"@": path.join(process.cwd(), "src")');
    expect(remotion).toContain(
      'if (typeof Config.overrideBundlerConfig === "function") {',
    );
    expect(remotion).toContain(
      "Config.overrideWebpackConfig(withRemocnAlias);",
    );
  });

  it("leaves a configured project alone", () => {
    const dir = project({
      "package.json": remotionPackage,
      "tsconfig.json": tsconfig,
      "remotion.config.ts": config,
    });
    run(SETUP, [dir]);
    const before = readFileSync(join(dir, "remotion.config.ts"), "utf8");

    const { json } = run(SETUP, [dir]);

    expect(json.components.action).toBe("unchanged");
    expect(json.tsconfig.action).toBe("unchanged");
    expect(json.bundler.action).toBe("unchanged");
    expect(readFileSync(join(dir, "remotion.config.ts"), "utf8")).toBe(before);
  });

  it("follows an existing @/ path instead of adding src", () => {
    const dir = project({
      "package.json": remotionPackage,
      "tsconfig.json": JSON.stringify({
        compilerOptions: { paths: { "@/*": ["./*"] } },
      }),
      "remotion.config.ts": config,
    });

    run(SETUP, [dir]);

    const remotion = readFileSync(join(dir, "remotion.config.ts"), "utf8");
    expect(remotion).toContain('"@": process.cwd()');
  });

  it("resolves an existing @/ path against baseUrl", () => {
    const dir = project({
      "package.json": remotionPackage,
      "tsconfig.json": JSON.stringify({
        compilerOptions: { baseUrl: "./src", paths: { "@/*": ["*"] } },
      }),
      "remotion.config.ts": config,
    });
    run(SETUP, [dir]);
    expect(readFileSync(join(dir, "remotion.config.ts"), "utf8")).toContain(
      '"@": path.join(process.cwd(), "src")',
    );
  });

  it("writes the new path relative to baseUrl", () => {
    const dir = project({
      "package.json": remotionPackage,
      "tsconfig.json": JSON.stringify({ compilerOptions: { baseUrl: "src" } }),
      "remotion.config.ts": config,
    });
    run(SETUP, [dir]);
    const ts = JSON.parse(readFileSync(join(dir, "tsconfig.json"), "utf8"));
    expect(ts.compilerOptions.paths).toEqual({ "@/*": ["./*"] });
  });

  it("does not shadow paths inherited through extends", () => {
    const dir = project({
      "package.json": remotionPackage,
      "tsconfig.base.json": JSON.stringify({
        compilerOptions: { paths: { "~lib/*": ["./lib/*"] } },
      }),
      "tsconfig.json": JSON.stringify({ extends: "./tsconfig.base.json" }),
      "remotion.config.ts": config,
    });
    const before = readFileSync(join(dir, "tsconfig.json"), "utf8");

    const { json } = run(SETUP, [dir]);

    expect(json.tsconfig.action).toBe("skipped");
    expect(json.tsconfig.warning).toContain("extends");
    expect(readFileSync(join(dir, "tsconfig.json"), "utf8")).toBe(before);
  });

  it("uses an @/ path inherited through extends", () => {
    const dir = project({
      "package.json": remotionPackage,
      "config/tsconfig.base.json": JSON.stringify({
        compilerOptions: { paths: { "@/*": ["../app/*"] } },
      }),
      "tsconfig.json": JSON.stringify({ extends: "./config/tsconfig.base" }),
      "remotion.config.ts": config,
    });
    const { json } = run(SETUP, [dir]);
    expect(json.tsconfig.base).toBe("app");
  });

  it("adds the registry to an existing components.json", () => {
    const dir = project({
      "package.json": remotionPackage,
      "components.json": JSON.stringify({ aliases: { components: "@/ui" } }),
    });

    run(SETUP, [dir]);

    const components = JSON.parse(
      readFileSync(join(dir, "components.json"), "utf8"),
    );
    expect(components.aliases.components).toBe("@/ui");
    expect(components.registries["@remocn"]).toBeDefined();
  });

  it("refuses a project without Remotion", () => {
    const dir = project({ "package.json": JSON.stringify({ name: "web" }) });
    const { exitCode, json } = run(SETUP, [dir]);
    expect(exitCode).toBe(1);
    expect(json.reason).toContain("create-video");
    expect(existsSync(join(dir, "components.json"))).toBe(false);
  });
});
