import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const sankeyFlowConfig: ComponentConfig = {
  componentName: "SankeyFlow",
  importPath: "@/components/remocn/sankey-flow",
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
    target: {
      type: "text-content",
      default: "remocn",
      description: "Target",
    },
    label: {
      type: "text-content",
      default: "videos rendered",
      description: "Label",
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
