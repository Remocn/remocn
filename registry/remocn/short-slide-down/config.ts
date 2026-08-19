import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shortSlideDownConfig: ComponentConfig = {
  componentName: "ShortSlideDown",
  importPath: "@/components/remocn/short-slide-down",
  controls: {
    text: {
      type: "text-content",
      default: "Build from above.",
      description: "Text",
    },
    entryOffset: {
      type: "number",
      min: 8,
      max: 80,
      step: 1,
      default: 28,
      description: "Entry offset",
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
