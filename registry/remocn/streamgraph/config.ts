import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    landAt: {
      type: "number",
      default: 82,
      min: 20,
      max: 140,
      step: 1,
      description: "Land at (frame)",
      hiddenFromList: false,
    },
    dim: {
      type: "number",
      default: 0.38,
      min: 0,
      max: 1,
      step: 0.01,
      description: "Dim others",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Bricolage Grotesque", grain: true }),
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
