import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    stagger: {
      type: "number",
      default: 6,
      min: 0,
      max: 20,
      step: 1,
      description: "Flow stagger",
      hiddenFromList: false,
    },
    flowLength: {
      type: "number",
      default: 34,
      min: 8,
      max: 90,
      step: 1,
      description: "Flow length (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Geist", grain: true }),
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
