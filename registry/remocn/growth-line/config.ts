import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const growthLineConfig: ComponentConfig = {
  componentName: "GrowthLine",
  importPath: "@/components/remocn/growth-line",
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
    value: {
      type: "text-content",
      default: "100k",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "creators in the first year",
      description: "Label",
    },
    steepness: {
      type: "number",
      default: 4.6,
      min: 0,
      max: 13.8,
      step: 0.01,
      description: "Steepness",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 400,
      min: 300,
      max: 700,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    strokeWidth: {
      type: "number",
      default: 3,
      min: 1,
      max: 10,
      step: 0.5,
      description: "Line width",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
