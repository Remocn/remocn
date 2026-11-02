import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const blockSwapConfig: ComponentConfig = {
  componentName: "BlockSwap",
  importPath: "@/components/remocn/block-swap",
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
    highlight: {
      type: "text-content",
      default: "launch",
      description: "Highlight",
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
