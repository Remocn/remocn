import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const treemapSplitConfig: ComponentConfig = {
  componentName: "TreemapSplit",
  importPath: "@/components/remocn/treemap-split",
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
    split: {
      type: "number",
      default: 22,
      min: 8,
      max: 48,
      step: 1,
      description: "Split (frames)",
      hiddenFromList: false,
    },
    radius: {
      type: "number",
      default: 6,
      min: 0,
      max: 24,
      step: 1,
      description: "Cell radius",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Schibsted Grotesk", grain: true }),
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
