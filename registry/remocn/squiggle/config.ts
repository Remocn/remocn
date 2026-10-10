import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { getSquiggleDuration } from ".";

function durationOf(values: Record<string, unknown>) {
  const numeric = (key: string) => {
    const value = values[key];
    return typeof value === "number" ? value : undefined;
  };
  return getSquiggleDuration({
    speed: numeric("speed"),
    delay: numeric("delay"),
    hold: numeric("hold"),
    erase: values.erase !== false,
  });
}

export const squiggleConfig: ComponentConfig = {
  componentName: "Squiggle",
  importPath: "@/components/remocn/squiggle",
  controls: {
    shape: {
      type: "enum",
      default: "wave",
      variants: { wave: {}, zigzag: {}, loops: {}, coil: {} },
      description: "Shape",
    },
    color: { type: "color", default: "#ffffff", description: "Line color" },
    weight: {
      type: "number",
      default: 3,
      min: 1,
      max: 12,
      step: 0.5,
      description: "Stroke weight",
      hiddenFromList: false,
    },
    amplitude: {
      type: "number",
      default: 14,
      min: 0,
      max: 60,
      step: 1,
      description: "Amplitude",
      hiddenFromList: false,
    },
    wavelength: {
      type: "number",
      default: 48,
      min: 12,
      max: 160,
      step: 2,
      description: "Wavelength",
      hiddenFromList: false,
    },
    length: {
      type: "number",
      default: 320,
      min: 40,
      max: 1200,
      step: 10,
      description: "Length",
      hiddenFromList: false,
    },
    angle: {
      type: "number",
      default: 0,
      min: -180,
      max: 180,
      step: 5,
      description: "Angle",
      hiddenFromList: false,
    },
    x: {
      type: "number",
      default: 0.375,
      min: 0,
      max: 1,
      step: 0.005,
      description: "Start x",
      hiddenFromList: false,
    },
    y: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.005,
      description: "Start y",
      hiddenFromList: false,
    },
    settle: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Settle",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 12,
      min: 0,
      max: 90,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
    },
    erase: { type: "boolean", default: true, description: "Erase" },
    delay: {
      type: "number",
      default: 0,
      min: 0,
      max: 60,
      step: 1,
      description: "Delay",
      hiddenFromList: false,
    },
  },
  durationInFrames: 80,
  getDurationInFrames: durationOf,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#002fa7" },
};
