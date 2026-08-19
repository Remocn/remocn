import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const microScaleFadeConfig: ComponentConfig = {
  componentName: "MicroScaleFade",
  importPath: "@/components/remocn/micro-scale-fade",
  controls: {
    text: {
      type: "text-content",
      default: "Welcome to motion.",
      description: "Text",
    },
    scaleFrom: {
      type: "number",
      min: 0.8,
      max: 1,
      step: 0.01,
      default: 0.96,
      description: "Scale from",
      hiddenFromList: false,
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 160,
      step: 1,
      default: 72,
      description: "Font size",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    fontWeight: {
      type: "enum",
      default: "600",
      variants: {
        "400": {},
        "500": {},
        "600": {},
        "700": {},
      },
      description: "Font weight",
    },
  },
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
