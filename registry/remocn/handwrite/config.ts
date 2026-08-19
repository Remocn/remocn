import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const handwriteConfig: ComponentConfig = {
  componentName: "Handwrite",
  importPath: "@/components/remocn/handwrite",
  controls: {
    text: {
      type: "text-content",
      default: "Made by hand",
      description: "Text",
    },
    fontSize: {
      type: "number",
      min: 24,
      max: 120,
      step: 1,
      default: 72,
      description: "Font size",
      hiddenFromList: false,
    },
    perStep: {
      type: "number",
      min: 0.5,
      max: 4,
      step: 0.1,
      default: 1.6,
      description: "Letters / pose",
      hiddenFromList: false,
    },
    weight: {
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
    color: {
      type: "color",
      default: "#26242c",
      description: "Color",
    },
    align: {
      type: "enum",
      default: "center",
      variants: {
        center: {},
        left: {},
      },
      description: "Align",
    },
    step: {
      type: "number",
      min: 1,
      max: 6,
      step: 1,
      default: 3,
      description: "Frames / pose",
      hiddenFromList: false,
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
};
