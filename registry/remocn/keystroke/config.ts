import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { getKeystrokeDuration } from ".";

const numberOf = (value: unknown) =>
  typeof value === "number" ? value : undefined;

function durationOf(values: Record<string, unknown>) {
  return getKeystrokeDuration({
    linger: numberOf(values.linger),
    speed: numberOf(values.speed),
  });
}

export const keystrokeConfig: ComponentConfig = {
  componentName: "Keystroke",
  importPath: "@/components/remocn/keystroke",
  controls: {
    platform: {
      type: "enum",
      default: "mac",
      variants: { mac: {}, windows: {} },
      description: "Platform",
    },
    theme: {
      type: "enum",
      default: "light",
      variants: { light: {}, dark: {} },
      description: "Theme",
    },
    accent: { type: "color", default: "#0a84ff", description: "Accent" },
    size: {
      type: "number",
      default: 64,
      min: 32,
      max: 128,
      step: 1,
      description: "Key size",
      hiddenFromList: false,
    },
    linger: {
      type: "number",
      default: 30,
      min: 0,
      max: 90,
      step: 1,
      description: "Linger",
      hiddenFromList: false,
    },
    x: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      description: "Center x",
      hiddenFromList: false,
    },
    y: {
      type: "number",
      default: 0.86,
      min: 0,
      max: 1,
      step: 0.01,
      description: "Center y",
      hiddenFromList: false,
    },
  },
  durationInFrames: 180,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#e9e9e5" },
};
