import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const blurOutUpConfig: ComponentConfig = {
  componentName: "BlurOutUp",
  importPath: "@/components/remocn/blur-out-up",
  controls: {
    text: {
      type: "text-content",
      default: "Clear in, airy out.",
      description: "Text",
    },
    staggerDelay: {
      type: "number",
      min: 0,
      max: 8,
      step: 1,
      default: 1,
      description: "Stagger",
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
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
