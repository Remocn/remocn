import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const abacusCountConfig: ComponentConfig = {
  componentName: "AbacusCount",
  importPath: "@/components/remocn/abacus-count",
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
      default: "renders this week",
      description: "Label",
    },
    value: {
      type: "number",
      default: 48216,
      min: 0,
      max: 144648,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    separator: {
      type: "text-content",
      default: ",",
      description: "Separator",
    },
    fontWeight: {
      type: "number",
      default: 300,
      min: 100,
      max: 900,
      step: 100,
      description: "Weight",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
