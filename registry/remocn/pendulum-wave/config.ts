import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

const numberOr = (value: unknown, fallback: number) =>
  typeof value === "number" ? value : fallback;

// One full loop, so the preview wraps on the realigned line.
function durationOf(values: Record<string, unknown>) {
  const speed = numberOr(values.speed, 1);
  const loopFrames = numberOr(values.loopFrames, 450);
  return speed > 0 ? Math.max(1, Math.round(loopFrames / speed)) : 450;
}

export const pendulumWaveConfig: ComponentConfig = {
  componentName: "PendulumWave",
  importPath: "@/components/remocn/pendulum-wave",
  controls: {
    count: {
      type: "number",
      default: 15,
      min: 2,
      max: 40,
      step: 1,
      description: "Pendulums",
      hiddenFromList: false,
    },
    cycles: {
      type: "number",
      default: 10,
      min: 1,
      max: 30,
      step: 1,
      description: "Swings of the slowest",
      hiddenFromList: false,
    },
    loopFrames: {
      type: "number",
      default: 450,
      min: 90,
      max: 900,
      step: 30,
      description: "Loop frames",
      hiddenFromList: false,
    },
    showGuides: { type: "boolean", default: true, description: "Guides" },
    background: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
    color: { type: "color", default: "#FFFFFF", description: "Bobs" },
    accent: { type: "color", default: "#E5322D", description: "Wave line" },
  },
  durationInFrames: 450,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
};
