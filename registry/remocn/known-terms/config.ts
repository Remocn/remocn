import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const knownTermsConfig: ComponentConfig = {
  componentName: "KnownTerms",
  importPath: "@/components/remocn/known-terms",
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
    joiner: {
      type: "text-content",
      default: "is",
      description: "Joiner",
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
