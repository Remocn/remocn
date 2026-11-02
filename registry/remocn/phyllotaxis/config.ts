import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

const numberOr = (value: unknown, fallback: number) =>
  typeof value === "number" ? value : fallback;

// Growth, the 10-frame pop of the last seed, then two pulses along the arm.
function durationOf(values: Record<string, unknown>) {
  const speed = numberOr(values.speed, 1);
  const motion =
    numberOr(values.growFrames, 60) + 10 + 2 * numberOr(values.pulseFrames, 45);
  return (speed > 0 ? Math.ceil(motion / speed) : motion) + 5;
}

export const phyllotaxisConfig: ComponentConfig = {
  componentName: "Phyllotaxis",
  importPath: "@/components/remocn/phyllotaxis",
  controls: {
    count: {
      type: "number",
      default: 420,
      min: 50,
      max: 1200,
      step: 10,
      description: "Seeds",
      hiddenFromList: false,
    },
    size: {
      type: "number",
      default: 1,
      min: 0.3,
      max: 2,
      step: 0.05,
      description: "Seed size",
      hiddenFromList: false,
    },
    arm: {
      type: "number",
      default: 21,
      min: 1,
      max: 89,
      step: 1,
      description: "Arm spacing",
      hiddenFromList: false,
    },
    growFrames: {
      type: "number",
      default: 60,
      min: 15,
      max: 150,
      step: 5,
      description: "Grow frames",
      hiddenFromList: false,
    },
    pulseFrames: {
      type: "number",
      default: 45,
      min: 15,
      max: 120,
      step: 5,
      description: "Pulse frames",
      hiddenFromList: false,
    },
    rotation: {
      type: "number",
      default: 4,
      min: -30,
      max: 30,
      step: 1,
      description: "Rotation °/s",
      hiddenFromList: false,
    },
    background: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
    color: { type: "color", default: "#FFFFFF", description: "Seeds" },
    accent: { type: "color", default: "#E5322D", description: "Arm" },
  },
  durationInFrames: 165,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
};
