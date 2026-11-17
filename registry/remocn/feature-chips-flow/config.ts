import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const featureChipsFlowConfig: ComponentConfig = {
  componentName: "FeatureChipsFlow",
  importPath: "@/components/remocn/feature-chips-flow",
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
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    converge: {
      type: "number",
      default: 58,
      min: 0,
      max: 120,
      step: 1,
      description: "Converge (frames)",
      hiddenFromList: false,
    },
    push: {
      type: "number",
      default: 0.045,
      min: 0,
      max: 0.2,
      step: 0.005,
      description: "Push-in",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
