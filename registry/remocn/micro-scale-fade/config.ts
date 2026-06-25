import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const microScaleFadeConfig: ComponentConfig = {
  componentName: "MicroScaleFade",
  importPath: "@/components/remocn/micro-scale-fade",
  controls: {
    text: { type: "text", default: "Welcome to motion.", label: "Text" },
    scaleFrom: {
      type: "number",
      default: 0.96,
      min: 0.8,
      max: 1,
      step: 0.01,
      label: "Scale from",
    },
    fontSize: {
      type: "number",
      default: 72,
      min: 12,
      max: 160,
      step: 1,
      label: "Font size",
    },
    color: { type: "color", default: "#171717", label: "Color" },
    fontWeight: {
      type: "select",
      default: "600",
      options: FONT_WEIGHT_OPTIONS,
      label: "Font weight",
    },
  },
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
