import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const macroPanConfig: ComponentConfig = {
  componentName: "MacroPan",
  importPath: "@/components/remocn/macro-pan",
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
    title: {
      type: "text-content",
      default: "Built to move.",
      description: "Title",
    },
    label: {
      type: "text-content",
      default: "remocn",
      description: "Label",
    },
    index: {
      type: "text-content",
      default: "01",
      description: "Index",
    },
    panLen: {
      type: "number",
      default: 100,
      min: 20,
      max: 200,
      step: 2,
      description: "Pan (frames)",
      hiddenFromList: false,
    },
    pullLen: {
      type: "number",
      default: 34,
      min: 6,
      max: 90,
      step: 1,
      description: "Pull-back (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Fraunces", grain: true }),
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
