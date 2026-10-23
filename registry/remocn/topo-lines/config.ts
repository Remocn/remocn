import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

const numberOr = (value: unknown, fallback: number) =>
  typeof value === "number" ? value : fallback;

// One full loop, so the preview wraps without a seam.
function durationOf(values: Record<string, unknown>) {
  const speed = numberOr(values.speed, 1);
  const loopFrames = numberOr(values.loopFrames, 300);
  return speed > 0 ? Math.max(1, Math.round(loopFrames / speed)) : 300;
}

export const topoLinesConfig: ComponentConfig = {
  componentName: "TopoLines",
  importPath: "@/components/remocn/topo-lines",
  controls: {
    levels: {
      type: "number",
      default: 16,
      min: 4,
      max: 32,
      step: 1,
      description: "Contours",
      hiddenFromList: false,
    },
    peaks: {
      type: "number",
      default: 3,
      min: 1,
      max: 5,
      step: 1,
      description: "Peaks",
      hiddenFromList: false,
    },
    highlight: {
      type: "number",
      default: 9,
      min: -1,
      max: 31,
      step: 1,
      description: "Accent contour",
      hiddenFromList: false,
    },
    indexEvery: {
      type: "number",
      default: 4,
      min: 0,
      max: 8,
      step: 1,
      description: "Index line every",
      hiddenFromList: false,
    },
    loopFrames: {
      type: "number",
      default: 300,
      min: 90,
      max: 900,
      step: 30,
      description: "Loop frames",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      default: 2,
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
    color: { type: "color", default: "#FFFFFF", description: "Contours" },
    accent: { type: "color", default: "#E5322D", description: "Accent" },
  },
  durationInFrames: 300,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
};
