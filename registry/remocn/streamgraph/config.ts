import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const streamgraphConfig: ComponentConfig = {
  componentName: "Streamgraph",
  importPath: "@/components/remocn/streamgraph",
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
      default: "of new projects",
      description: "Label",
    },
    highlight: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Highlight",
      hiddenFromList: false,
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
