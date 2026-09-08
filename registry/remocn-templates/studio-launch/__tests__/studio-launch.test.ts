import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { resolveStudioProps, studioContent } from "../content";
import { STUDIO_FRAMES, studioTimeline } from "../motion";

test("every reference frame has exactly one scene", () => {
  const coverage = new Uint8Array(STUDIO_FRAMES);
  for (const shot of studioTimeline)
    for (let frame = shot.from; frame < shot.to; frame++) coverage[frame]++;
  expect(coverage.every((n) => n === 1)).toBe(true);
  expect(STUDIO_FRAMES).toBe(1065);
});
test("brand overrides propagate and partial media lists remain renderable", () => {
  const scene = resolveStudioProps(
    {
      brandName: "Forma",
      content: { courseTitles: ["Your course"] },
      media: { courses: ["custom.jpg"] },
    },
    12,
  );
  expect(scene.brandName).toBe("Forma");
  expect(scene.content.courseTitles[0]).toBe("Your course");
  expect(scene.content.courseTitles[1]).toBe(studioContent.courseTitles[1]);
  expect(scene.media.courses[0]).toBe("custom.jpg");
  expect(scene.media.courses.length).toBe(6);
  expect(scene.media.courses[1].startsWith("data:image/jpeg;base64,")).toBe(
    true,
  );
  expect(resolveStudioProps({}, 0).brandName).toBe("remocn");
});
test("registry installation includes every local import and no private paths or original brand copy", () => {
  const base = path.resolve(import.meta.dir, "../..");
  const registry = JSON.parse(
    readFileSync(path.join(base, "registry.json"), "utf8"),
  );
  const item = registry.items.find(
    (entry: { name: string }) => entry.name === "studio-launch",
  );
  const shipped = new Set<string>(
    item.files.map((file: { path: string }) => path.resolve(base, file.path)),
  );
  for (const file of shipped) {
    expect(existsSync(file)).toBe(true);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(
      /(?:from\s+|import\s*)["'](\.[^"']+)["']/g,
    )) {
      const resolved = path.resolve(path.dirname(file), match[1]);
      expect(
        [resolved, `${resolved}.ts`, `${resolved}.tsx`].some((p) =>
          shipped.has(p),
        ),
      ).toBe(true);
    }
    for (const forbidden of [
      "/Downloads/",
      "@/registry/",
      "Math.random()",
      "Date.now()",
      "Commas Studios",
      "<Video",
      "<OffthreadVideo",
    ])
      expect(source).not.toContain(forbidden);
  }
  expect(item.dependencies).toContain("@fontsource/manrope");
});
