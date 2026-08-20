import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const topDownLettersConfig: ComponentConfig = {
  componentName: "TopDownLetters",
  importPath: "@/components/remocn/top-down-letters",
  controls: {
    text: {
      type: "text-content",
      default: "Signal",
      description: "Text",
    },
    staggerDelay: {
      type: "number",
      min: 1,
      max: 12,
      step: 1,
      default: 3,
      description: "Stagger",
      hiddenFromList: false,
    },
    distance: {
      type: "number",
      min: 0,
      max: 120,
      step: 1,
      default: 46,
      description: "Distance",
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
  dimensions: { width: 230, height: 100 },
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
