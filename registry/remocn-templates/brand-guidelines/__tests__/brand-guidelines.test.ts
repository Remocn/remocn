import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { wcagContrast } from "culori";
import { brandGuidelinesMedia } from "../assets";
import {
  brandGuidelinesClosingWords,
  brandGuidelinesContent,
  brandGuidelinesPhrases,
  brandGuidelinesTheme,
  resolveBrandGuidelinesProps,
} from "../content";
import {
  atFps,
  BRAND_GUIDELINES_FRAMES,
  brandGuidelinesTimeline,
  fitSize,
  graphemes,
  progress,
  slide,
  specimenState,
} from "../motion";

const base = path.resolve(import.meta.dir, "../..");
const root = path.resolve(base, "../..");

test("all picture frames have a scene, including overlapping transitions, at common fps", () => {
  for (const fps of [24, 25, 30, 50, 60]) {
    const clips = brandGuidelinesTimeline.map((clip) => ({
      from: atFps(clip.from, fps),
      to: atFps(clip.to, fps),
    }));
    for (let frame = 0; frame < atFps(BRAND_GUIDELINES_FRAMES, fps); frame++) {
      const active = clips.filter(
        (clip) => frame >= clip.from && frame < clip.to,
      );
      expect(active.length).toBeGreaterThan(0);
      expect(active.length).toBeLessThanOrEqual(2);
    }
  }
  expect(atFps(BRAND_GUIDELINES_FRAMES, 30)).toBe(536);
  expect(brandGuidelinesTimeline.at(-1)?.to).toBe(1072);
});

test("five Studio sequences match the documented reference intervals", () => {
  const source = readFileSync(
    path.join(base, "brand-guidelines/index.tsx"),
    "utf8",
  ).replace(/\s+/g, " ");
  for (const clip of brandGuidelinesTimeline) {
    const expected =
      clip.from === 0
        ? `name="${clip.name}" from={0} durationInFrames={at(${clip.to})}`
        : `name="${clip.name}" from={at(${clip.from})} durationInFrames={at(${clip.to}) - at(${clip.from})}`;
    expect(source).toContain(expected);
  }
});

test("typing reveals, holds, backspaces, and completes the second specimen", () => {
  const state = (frame: number) => specimenState(frame, brandGuidelinesPhrases);
  expect(state(324).text).toBe("");
  expect(state(380).text).toBe(brandGuidelinesPhrases[0]);
  expect(state(394).text).toBe(brandGuidelinesPhrases[0]);
  expect(state(415).text.length).toBeLessThan(state(400).text.length);
  expect(state(430).text).toBe("");
  expect(state(443).text).toBe("");
  expect(state(493).text).toBe(brandGuidelinesPhrases[1]);
  for (const [index, frame] of [512, 538, 550, 562, 578, 594].entries()) {
    expect(state(frame).text).toBe(brandGuidelinesPhrases[index + 2]);
  }
  expect(state(594).caret).toBe(false);
});

test("seeking is deterministic and Unicode reveal preserves complete graphemes", () => {
  const phrases = [...brandGuidelinesPhrases];
  phrases[0] = "👩🏽‍🎨 Cafe\u0301 🌿";
  expect(graphemes(phrases[0])).toEqual([
    "👩🏽‍🎨",
    " ",
    "C",
    "a",
    "f",
    "e\u0301",
    " ",
    "🌿",
  ]);
  const forward = Array.from({ length: 482 }, (_, frame) =>
    specimenState(frame + 324, phrases),
  );
  for (let frame = 805; frame >= 324; frame--) {
    const state = specimenState(frame, phrases);
    expect(state).toEqual(forward[frame - 324]);
    expect(state.fullText.startsWith(state.text)).toBe(true);
    expect(state.settledText + state.activeText).toBe(state.text);
  }
});

test("partial and blank props preserve complete defaults without mutating callers", () => {
  const phrases = ["A new study.", " "];
  const scene = resolveBrandGuidelinesProps({
    brandName: "  North Studio  ",
    accentColor: "#285A50",
    content: { brandName: "Lower priority", openingTagline: undefined },
    theme: { accent: "#FF0000", ink: "" },
    phrases,
    closingWords: ["See"],
    photos: { ceramics: "" },
  });
  expect(scene.content.brandName).toBe("North Studio");
  expect(scene.content.openingTagline).toBe(
    brandGuidelinesContent.openingTagline,
  );
  expect(scene.theme.ink).toBe(brandGuidelinesTheme.ink);
  expect(scene.theme.accent).toBe("#285A50");
  expect(scene.phrases).toHaveLength(8);
  expect(scene.phrases[1]).toBe(brandGuidelinesPhrases[1]);
  expect(scene.closingWords).toEqual([
    "See",
    ...brandGuidelinesClosingWords.slice(1),
  ]);
  expect(scene.photos).toEqual(brandGuidelinesMedia);
  expect(phrases).toEqual(["A new study.", " "]);
  expect(brandGuidelinesContent.brandName).toBe("Form Study");
});

test("photo and custom mark overrides are independent and normalized", () => {
  const scene = resolveBrandGuidelinesProps({
    photos: { chair: "  data:image/png;base64,custom  " },
    logoSrc: "  custom-logo.svg ",
  });
  expect(scene.photos.chair).toBe("data:image/png;base64,custom");
  expect(scene.photos.ceramics).toBe(brandGuidelinesMedia.ceramics);
  expect(scene.logoSrc).toBe("custom-logo.svg");
  expect(resolveBrandGuidelinesProps({ logoSrc: " " }).logoSrc).toBeUndefined();
});

test("reduced motion removes progressive typing and rapid style cuts", () => {
  for (const frame of [324, 365, 400])
    expect(specimenState(frame, brandGuidelinesPhrases, true).text).toBe(
      brandGuidelinesPhrases[0],
    );
  for (const frame of [512, 550, 578, 594]) {
    const state = specimenState(frame, brandGuidelinesPhrases, true);
    expect(state.text).toBe(brandGuidelinesPhrases[7]);
    expect(state.caret).toBe(false);
  }
});

test("motion is clamped and complete-phrase sizing is safe", () => {
  for (const fn of [slide, progress]) {
    expect(fn(-100, 0, 10)).toBe(0);
    expect(fn(100, 0, 10)).toBe(1);
  }
  for (const text of [
    "",
    "W",
    "A longer identity name that remains on the same line.",
    "👩🏽‍🎨",
  ]) {
    expect(fitSize(text, 80, 850)).toBeGreaterThan(0);
    expect(fitSize(text, 80, 850)).toBeLessThanOrEqual(80);
  }
  expect(fitSize("W".repeat(50), 80, 850)).toBeLessThan(30);
});

test("the default palette retains readable text on every swatch", () => {
  const { paper, ink, accent, stone } = brandGuidelinesTheme;
  for (const [foreground, background] of [
    [paper, ink],
    [paper, accent],
    [ink, stone],
    [ink, paper],
  ]) {
    expect(wcagContrast(foreground, background)).toBeGreaterThan(4.5);
  }
});

test("all bundled photographs match the documented newly generated files", () => {
  for (const key of ["ceramics", "materials", "chair"] as const) {
    const jpeg = readFileSync(
      path.join(root, "public/templates/brand-guidelines", `${key}.jpg`),
    );
    expect(jpeg[0]).toBe(0xff);
    expect(jpeg[1]).toBe(0xd8);
    expect(brandGuidelinesMedia[key]).toBe(
      `data:image/jpeg;base64,${jpeg.toString("base64")}`,
    );
  }
});

test("installable module graph is closed and no source-brand media or copy ships", () => {
  const registry = JSON.parse(
    readFileSync(path.join(base, "registry.json"), "utf8"),
  );
  const item = registry.items.find(
    (entry: { name: string }) => entry.name === "brand-guidelines",
  );
  const files = new Set<string>(
    item.files.map((file: { path: string }) => path.resolve(base, file.path)),
  );
  expect(files.size).toBe(10);
  expect(item.registryDependencies).toEqual(["@remocn/caret"]);
  expect(item.dependencies).toContain("@fontsource/manrope");
  expect(item.dependencies).toContain("@fontsource/inter");
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(
      /(?:from\s+|import\s*)["'](\.[^"']+)["']/g,
    )) {
      const local = path.resolve(path.dirname(file), match[1]);
      expect(
        [local, `${local}.ts`, `${local}.tsx`].some((candidate) =>
          files.has(candidate),
        ),
      ).toBe(true);
    }
    if (file.endsWith("assets.ts")) continue;
    expect(source).not.toMatch(
      /\bNike\b|\bswoosh\b|Just do it|Futura|Bo knows/i,
    );
    for (const forbidden of [
      "/Downloads/",
      "@/registry/",
      "Math.random(",
      "Date.now(",
      "<Video",
      "<OffthreadVideo",
      "setInterval(",
      "@keyframes",
    ])
      expect(source).not.toContain(forbidden);
  }
});
