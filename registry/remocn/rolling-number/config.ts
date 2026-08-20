import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rollingNumberConfig: ComponentConfig = {
  componentName: "RollingNumber",
  importPath: "@/components/remocn/rolling-number",
  controls: {
    from: {
      type: "number",
      min: 0,
      step: 1,
      default: 0,
      description: "From",
      hiddenFromList: false,
    },
    to: {
      type: "number",
      min: 0,
      step: 1,
      default: 24813,
      description: "To",
      hiddenFromList: false,
    },
    fontSize: {
      type: "number",
      min: 24,
      max: 280,
      step: 4,
      default: 120,
      description: "Font size",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
  },
  dimensions: { width: 380, height: 140 },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
