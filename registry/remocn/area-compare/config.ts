import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const areaCompareConfig: ComponentConfig = {
  componentName: "AreaCompare",
  importPath: "@/components/remocn/area-compare",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    label: {
      type: "text-content",
      default: "Bundle size",
      description: "Label",
    },
    before: {
      type: "text-content",
      default: "Before",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "remocn",
      description: "After",
    },
    unit: {
      type: "text-content",
      default: "KB",
      description: "Unit",
    },
    verdict: {
      type: "text-content",
      default: "smaller",
      description: "Verdict",
    },
    shape: {
      type: "enum",
      default: "circle",
      variants: {
        circle: {},
        square: {},
      },
      description: "Shape",
    },
    beforeValue: {
      type: "number",
      default: 1200,
      min: 0,
      max: 3600,
      step: 1,
      description: "Before value",
      hiddenFromList: false,
    },
    afterValue: {
      type: "number",
      default: 84,
      min: 0,
      max: 252,
      step: 1,
      description: "After value",
      hiddenFromList: false,
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
