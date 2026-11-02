import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const threeStepsConfig: ComponentConfig = {
  componentName: "ThreeSteps",
  importPath: "@/components/remocn/three-steps",
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
    eyebrow: {
      type: "text-content",
      default: "How it works",
      description: "Eyebrow",
    },
    outcome: {
      type: "text-content",
      default: "Your launch video, shipped",
      description: "Outcome",
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
