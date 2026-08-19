import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const maskRevealUpConfig: ComponentConfig = {
  componentName: "MaskRevealUp",
  importPath: "@/components/remocn/mask-reveal-up",
  controls: {
    text: {
      type: "text-content",
      default: "Designed to move.\nBuilt to focus.",
      description: "Text",
    },
    distance: {
      type: "number",
      min: 0,
      max: 120,
      step: 1,
      default: 30,
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
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
