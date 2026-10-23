import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

const numberOr = (value: unknown, fallback: number) =>
  typeof value === "number" ? value : fallback;

// The back row starts last, at 2·(grid − 1)·stagger plus up to one stagger of
// jitter, and its spring settles about 20 frames later. A hold follows.
function durationOf(values: Record<string, unknown>) {
  const speed = numberOr(values.speed, 1);
  const grid = Math.max(1, Math.round(numberOr(values.grid, 5)));
  const stagger = numberOr(values.stagger, 2);
  const build = (2 * (grid - 1) + 1) * stagger + 20;
  return (speed > 0 ? Math.ceil(build / speed) : build) + 52;
}

export const isometricBuildConfig: ComponentConfig = {
  componentName: "IsometricBuild",
  importPath: "@/components/remocn/isometric-build",
  controls: {
    grid: {
      type: "number",
      default: 5,
      min: 2,
      max: 9,
      step: 1,
      description: "Tiles per side",
      hiddenFromList: false,
    },
    maxHeight: {
      type: "number",
      default: 2.2,
      min: 0.5,
      max: 4,
      step: 0.1,
      description: "Max height",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 6,
      step: 0.5,
      description: "Stagger",
      hiddenFromList: false,
    },
    gap: {
      type: "number",
      default: 0.04,
      min: 0,
      max: 0.3,
      step: 0.01,
      description: "Gap",
      hiddenFromList: false,
    },
    floors: { type: "boolean", default: true, description: "Floor lines" },
    seed: {
      type: "number",
      default: 4,
      min: 1,
      max: 50,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
    background: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
    color: { type: "color", default: "#FFFFFF", description: "Blocks" },
    accent: { type: "color", default: "#E5322D", description: "Accent tower" },
  },
  durationInFrames: 90,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
};
