import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const numberWheelConfig: ComponentConfig = {
  componentName: "NumberWheel",
  importPath: "@/components/remocn/number-wheel",
  controls: {
    from: {
      type: "number-input",
      default: 0,
      min: 0,
      max: 1000000,
      step: 1,
      label: "From",
    },
    to: {
      type: "number-input",
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
  durationInFrames: 112,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
