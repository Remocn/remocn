import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rollingNumberConfig: ComponentConfig = {
  componentName: "RollingNumber",
  importPath: "@/components/remocn/rolling-number",
  controls: {
    from: {
      type: "number",
      default: 0,
      min: 0,
      max: 1000000,
      step: 1,
      label: "From",
    },
    to: {
      type: "number",
      default: 24813,
      min: 0,
      max: 1000000,
      step: 1,
      label: "To",
    },
    fontSize: {
      type: "number",
      default: 120,
      min: 24,
      max: 280,
      step: 4,
      label: "Font size",
    },
    color: { type: "color", default: "#171717", label: "Color" },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
