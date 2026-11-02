import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const flankRollSwapConfig: ComponentConfig = {
  componentName: "FlankRollSwap",
  importPath: "@/components/remocn/flank-roll-swap",
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
    accentWord: {
      type: "text-content",
      default: "remocn.dev",
      description: "Accent word",
    },
  },
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
