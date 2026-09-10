import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { launchContent, resolveLaunchProps } from "../content";
import {
  deskCamera,
  getShowcase,
  LAUNCH_FRAMES,
  launchTimeline,
  showcaseTimeline,
} from "../motion";

test("scene and display timelines cover every frame exactly once", () => {
  for (const [timeline, from, to] of [
    [launchTimeline, 0, LAUNCH_FRAMES],
    [showcaseTimeline, 440, 907],
  ] as const) {
    expect(timeline[0].from).toBe(from);
    expect(timeline.at(-1)?.to).toBe(to);
    for (let frame = from; frame < to; frame++) {
      expect(
        timeline.filter((shot) => frame >= shot.from && frame < shot.to),
      ).toHaveLength(1);
    }
  }
});

test("screen switches on measured cut frames, including direct seeks", () => {
  for (const shot of [...showcaseTimeline].reverse()) {
    expect(getShowcase(shot.from / 60).id).toBe(shot.id);
    expect(getShowcase((shot.to - 1) / 60).id).toBe(shot.id);
  }
  expect(getShowcase(-100).id).toBe("dashboard");
  expect(getShowcase(100).id).toBe("integrations");
});

test("camera keeps approaching and stays continuous at segment boundaries", () => {
  let last = 0;
  for (let frame = 440; frame < 907; frame++) {
    const camera = deskCamera(frame / 60);
    expect(Number.isFinite(camera.x) && Number.isFinite(camera.y)).toBe(true);
    expect(camera.scale).toBeGreaterThanOrEqual(last);
    last = camera.scale;
  }
  for (const t of [8, 9.25, 10.35, 11.25, 12.35, 13.3]) {
    expect(
      Math.abs(deskCamera(t - 1e-6).scale - deskCamera(t + 1e-6).scale),
    ).toBeLessThan(0.00001);
  }
});

test("partial customization preserves defaults, including empty integration fallbacks", () => {
  const scene = resolveLaunchProps({
    brandUrl: "Acme.studio",
    opening: "Your next",
    content: { proof: "Built for teams", integrations: [] },
    media: { horizon: "custom.jpg" },
    screenImages: { dashboard: "dashboard.png" },
  });
  expect(scene.brandUrl).toBe("Acme.studio");
  expect(scene.content.opening).toBe("Your next");
  expect(scene.content.proof).toBe("Built for teams");
  expect(scene.content.subject).toBe(launchContent.subject);
  expect(scene.content.integrations).toEqual(launchContent.integrations);
  expect(scene.media.horizon).toBe("custom.jpg");
  expect(scene.media.desk.startsWith("data:image/jpeg;base64,")).toBe(true);
  expect(scene.screenImages.dashboard).toBe("dashboard.png");
  expect(scene.screenImages.trading).toBeUndefined();
});

test("registry ships every relative module and declares its chrome dependency", () => {
  const base = path.resolve(import.meta.dir, "../..");
  const registry = JSON.parse(
    readFileSync(path.join(base, "registry.json"), "utf8"),
  );
  const item = registry.items.find(
    (entry: { name: string }) => entry.name === "launch-anything",
  );
  const files = new Set<string>(
    item.files.map((file: { path: string }) => path.resolve(base, file.path)),
  );
  for (const file of files) {
    expect(existsSync(file)).toBe(true);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(
      /(?:from\s+|import\s*)["'](\.[^"']+)["']/g,
    )) {
      const resolved = path.resolve(path.dirname(file), match[1]);
      expect(
        [resolved, `${resolved}.ts`, `${resolved}.tsx`].some((candidate) =>
          files.has(candidate),
        ),
      ).toBe(true);
    }
    for (const forbidden of [
      "/Downloads/",
      "@/registry/",
      "Math.random()",
      "Date.now()",
      "<Video",
      "<OffthreadVideo",
    ])
      expect(source).not.toContain(forbidden);
  }
  expect(item.registryDependencies).toContain("@remocn/shader-text-reveal");
  expect(item.dependencies).toContain("@fontsource/manrope");
});
