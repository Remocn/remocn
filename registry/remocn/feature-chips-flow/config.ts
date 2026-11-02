import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
