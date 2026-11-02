import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const focusPanTextConfig: ComponentConfig = {
  componentName: "FocusPanText",
  importPath: "@/components/remocn/focus-pan-text",
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
    meta: {
      type: "text-content",
      default: "Just now",
      description: "Meta",
    },
    firstHold: {
      type: "number",
      default: 30,
      min: 0,
      max: 90,
      step: 1,
      description: "First hold",
      hiddenFromList: false,
    },
  },
  durationInFrames: 169,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
