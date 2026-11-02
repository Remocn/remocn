import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const focusFrontSwapConfig: ComponentConfig = {
  componentName: "FocusFrontSwap",
  importPath: "@/components/remocn/focus-front-swap",
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
    logo: {
      type: "boolean",
      default: true,
      description: "Logo",
    },
    blur: {
      type: "number",
      default: 18,
      min: 0,
      max: 54,
      step: 1,
      description: "Blur",
      hiddenFromList: false,
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
