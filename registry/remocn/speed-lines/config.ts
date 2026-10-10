import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { getSpeedLinesDuration } from ".";

const numberOf = (value: unknown) =>
  typeof value === "number" ? value : undefined;

function durationOf(values: Record<string, unknown>) {
  return getSpeedLinesDuration({
    mode: values.mode === "focus" ? "focus" : "trail",
    duration: numberOf(values.duration),
    bounce: numberOf(values.bounce),
    delay: numberOf(values.delay),
    speed: numberOf(values.speed),
  });
}

export const speedLinesConfig: ComponentConfig = {
  componentName: "SpeedLines",
  importPath: "@/components/remocn/speed-lines",
  controls: {
    mode: {
      type: "enum",
      default: "trail",
      variants: { trail: {}, focus: {} },
      description: "Mode",
    },
    count: {
      type: "number",
      default: 12,
      min: 3,
      max: 32,
      step: 1,
      description: "Lines",
      hiddenFromList: false,
    },
    weight: {
      type: "number",
      default: 2,
      min: 1,
      max: 8,
      step: 0.5,
      description: "Stroke weight",
      hiddenFromList: false,
    },
    spread: {
      type: "number",
      default: 96,
      min: 16,
      max: 320,
      step: 4,
      description: "Spread",
      hiddenFromList: false,
    },
    duration: {
      type: "number",
      default: 14,
      min: 6,
      max: 40,
      step: 1,
      description: "Travel frames",
      hiddenFromList: false,
    },
    bounce: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Bounce",
      hiddenFromList: false,
    },
    squash: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Squash",
      hiddenFromList: false,
    },
    x: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      description: "Point x",
      hiddenFromList: false,
    },
    y: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      description: "Point y",
      hiddenFromList: false,
    },
    delay: {
      type: "number",
      default: 0,
      min: 0,
      max: 60,
      step: 1,
      description: "Delay",
      hiddenFromList: false,
    },
    color: { type: "color", default: "#ffffff", description: "Line color" },
    seed: {
      type: "number",
      default: 1,
      min: 1,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 55,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#002fa7" },
};
