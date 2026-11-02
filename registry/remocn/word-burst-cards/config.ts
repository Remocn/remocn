import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const wordBurstCardsConfig: ComponentConfig = {
  componentName: "WordBurstCards",
  importPath: "@/components/remocn/word-burst-cards",
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
    line: {
      type: "text-content",
      default: "Every screen you built, in motion",
      description: "Line",
    },
    caption: {
      type: "text-content",
      default: "Launch films from your product",
      description: "Caption",
    },
    reverse: {
      type: "boolean",
      default: false,
      description: "Reverse",
    },
    showLogo: {
      type: "boolean",
      default: true,
      description: "Show logo",
    },
    seed: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
