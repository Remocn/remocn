import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const inlineHighlightConfig: ComponentConfig = {
  componentName: "InlineHighlight",
  importPath: "@/components/remocn/inline-highlight",
  controls: {
    before: {
      type: "text-content",
      default: "Ship faster with ",
      description: "Before",
    },
    highlight: {
      type: "text-content",
      default: "remocn",
      description: "Highlight",
    },
    after: {
      type: "text-content",
      default: ".",
      description: "After",
    },
    baseColor: {
      type: "color",
      default: "#171717",
      description: "Base color",
    },
    highlightColor: {
      type: "color",
      default: "#ff5e3a",
      description: "Highlight color",
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
  dimensions: { width: 640, height: 100 },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
