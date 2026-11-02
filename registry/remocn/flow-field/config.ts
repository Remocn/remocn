import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

const numberOr = (value: unknown, fallback: number) =>
  typeof value === "number" ? value : fallback;

// One full loop, so the preview wraps without a seam.
function durationOf(values: Record<string, unknown>) {
  const speed = numberOr(values.speed, 1);
  const loopFrames = numberOr(values.loopFrames, 300);
  return speed > 0 ? Math.max(1, Math.round(loopFrames / speed)) : 300;
}

export const flowFieldConfig: ComponentConfig = {
  componentName: "FlowField",
  importPath: "@/components/remocn/flow-field",
  controls: {
    particles: {
      type: "number",
      default: 300,
      min: 50,
      max: 800,
      step: 10,
      description: "Particles",
      hiddenFromList: false,
    },
    trailLength: {
      type: "number",
      default: 72,
      min: 8,
      max: 120,
      step: 1,
      description: "Trail length",
      hiddenFromList: false,
    },
    strokeWidth: {
      type: "number",
      default: 1.4,
      min: 0.5,
      max: 4,
      step: 0.1,
      description: "Stroke width",
      hiddenFromList: false,
    },
    accentRatio: {
      type: "number",
      default: 0.1,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Accent share",
      hiddenFromList: false,
    },
    loopFrames: {
      type: "number",
      default: 300,
      min: 120,
      max: 600,
      step: 30,
      description: "Loop frames",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      default: 1,
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
    color: { type: "color", default: "#FFFFFF", description: "Trails" },
    accent: { type: "color", default: "#E5322D", description: "Accent" },
  },
  durationInFrames: 300,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
};
