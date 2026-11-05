import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const monoSettleConfig: ComponentConfig = {
  componentName: "MonoSettle",
  importPath: "@/components/remocn/mono-settle",
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
    highlight: {
      type: "text-content",
      default: "the edit.",
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
