import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const neuralPulseConfig: ComponentConfig = {
  componentName: "NeuralPulse",
  importPath: "@/components/remocn/neural-pulse",
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
    input: {
      type: "text-content",
      default: "Make a launch film",
      description: "Input",
    },
    output: {
      type: "text-content",
      default: "remocn",
      description: "Output",
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
  durationInFrames: 230,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
