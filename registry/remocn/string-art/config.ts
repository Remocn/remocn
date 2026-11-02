import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

const numberOr = (value: unknown, fallback: number) =>
  typeof value === "number" ? value : fallback;

// Stringing, a 24-frame pause, the morph, then a short hold on the last figure.
function durationOf(values: Record<string, unknown>) {
  const speed = numberOr(values.speed, 1);
  const motion =
    numberOr(values.stringFrames, 60) + 24 + numberOr(values.morphFrames, 240);
  return (speed > 0 ? Math.ceil(motion / speed) : motion) + 16;
}

export const stringArtConfig: ComponentConfig = {
  componentName: "StringArt",
  importPath: "@/components/remocn/string-art",
  controls: {
    pins: {
      type: "number",
      default: 200,
      min: 40,
      max: 400,
      step: 10,
      description: "Pins",
      hiddenFromList: false,
    },
    from: {
      type: "number",
      default: 2,
      min: 1,
      max: 12,
      step: 0.5,
      description: "From multiplier",
      hiddenFromList: false,
    },
    to: {
      type: "number",
      default: 4,
      min: 1,
      max: 12,
      step: 0.5,
      description: "To multiplier",
      hiddenFromList: false,
    },
    morphFrames: {
      type: "number",
      default: 240,
      min: 30,
      max: 600,
      step: 10,
      description: "Morph frames",
      hiddenFromList: false,
    },
    sweep: {
      type: "number",
      default: 0.08,
      min: 0,
      max: 0.3,
      step: 0.01,
      description: "Accent sweep",
      hiddenFromList: false,
    },
    threadOpacity: {
      type: "number",
      default: 0.42,
      min: 0.1,
      max: 1,
      step: 0.02,
      description: "Thread opacity",
      hiddenFromList: false,
    },
    showLabel: { type: "boolean", default: true, description: "Label" },
    background: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
    color: { type: "color", default: "#FFFFFF", description: "Threads" },
    accent: { type: "color", default: "#E5322D", description: "Accent" },
  },
  durationInFrames: 340,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
};
