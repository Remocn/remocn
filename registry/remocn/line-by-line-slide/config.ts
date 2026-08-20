import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const lineByLineSlideConfig: ComponentConfig = {
  componentName: "LineByLineSlide",
  importPath: "@/components/remocn/line-by-line-slide",
  controls: {
    text: {
      type: "text-content",
      default: "Think different.\nDo more.",
      description: "Text",
    },
    distance: {
      type: "number",
      min: 0,
      max: 160,
      step: 1,
      default: 48,
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
  dimensions: { width: 600, height: 200 },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
