import { synthwaveExampleCode } from "@/components/docs/examples/synthwave-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const synthwaveConfig: ComponentConfig = {
  componentName: "Synthwave",
  importPath: "@/components/remocn/synthwave",
  controls: {
    gridSpeed: {
      type: "number",
      default: 2,
      min: 0,
      max: 6,
      step: 0.25,
      description: "Grid speed",
      hiddenFromList: false,
    },
    horizon: {
      type: "number",
      default: 0.6,
      min: 0.4,
      max: 0.8,
      step: 0.01,
      description: "Horizon",
      hiddenFromList: false,
    },
    sunStripes: {
      type: "boolean",
      default: true,
      description: "Scrolling sun stripes",
    },
    grid: { type: "color", default: "#E5322D", description: "Grid" },
    sunTop: { type: "color", default: "#FFC46B", description: "Sun top" },
    sunBottom: {
      type: "color",
      default: "#E5322D",
      description: "Sun bottom",
    },
    skyHorizon: {
      type: "color",
      default: "#3B0C10",
      description: "Horizon glow",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#08080B" },
  snippet: synthwaveExampleCode,
};
