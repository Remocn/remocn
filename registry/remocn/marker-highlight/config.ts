import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const markerHighlightConfig: ComponentConfig = {
  componentName: "MarkerHighlight",
  importPath: "@/components/remocn/marker-highlight",
  controls: {
    before: {
      type: "text-content",
      default: "Made for ",
      description: "Before",
    },
    highlight: {
      type: "text-content",
      default: "builders",
      description: "Highlight",
    },
    after: {
      type: "text-content",
      default: ".",
      description: "After",
    },
    markerColor: {
      type: "color",
      default: "#facc15",
      description: "Marker color",
    },
    baseColor: {
      type: "color",
      default: "#171717",
      description: "Base color",
    },
    highlightedTextColor: {
      type: "color",
      default: "#171717",
      description: "Highlighted text color",
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
  dimensions: { width: 340, height: 100 },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
