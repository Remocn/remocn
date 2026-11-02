import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const choreFoldConfig: ComponentConfig = {
  componentName: "ChoreFold",
  importPath: "@/components/remocn/chore-fold",
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
      default: "By hand",
      description: "Label",
    },
    name: {
      type: "text-content",
      default: "Captions",
      description: "Name",
    },
    result: {
      type: "text-content",
      default: "does all of that.",
      description: "Result",
    },
    payoff: {
      type: "text-content",
      default: "You just talk.",
      description: "Payoff",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
