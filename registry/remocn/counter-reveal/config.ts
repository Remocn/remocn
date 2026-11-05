import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const counterRevealConfig: ComponentConfig = {
  componentName: "CounterReveal",
  importPath: "@/components/remocn/counter-reveal",
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
    word: {
      type: "text-content",
      default: "Beta",
      description: "Word",
    },
    line: {
      type: "text-content",
      default: "Out now.",
      description: "Line",
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
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
