import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const perspectiveSqueezeConfig: ComponentConfig = {
  componentName: "PerspectiveSqueeze",
  importPath: "@/components/remocn/perspective-squeeze",
  controls: {
    upperText: {
      type: "text-content",
      default: "REMOCN",
      description: "Upper line",
    },
    lowerText: {
      type: "text-content",
      default: "BEST",
      description: "Lower line",
    },
    fill: {
      type: "color",
      default: "#f2f2f2",
      description: "Fill",
    },
    upperFontFamily: {
      type: "text-content",
      default: "Impact, 'Arial Narrow', sans-serif",
      description: "Upper font",
    },
    lowerFontFamily: {
      type: "text-content",
      default: "Impact, 'Arial Narrow', sans-serif",
      description: "Lower font",
    },
    lineGap: {
      type: "number",
      min: 0,
      max: 120,
      step: 2,
      default: 50,
      description: "Line gap",
      hiddenFromList: false,
    },
  },
  durationInFrames: 225,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
};
