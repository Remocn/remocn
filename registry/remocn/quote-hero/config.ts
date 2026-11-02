import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const quoteHeroConfig: ComponentConfig = {
  componentName: "QuoteHero",
  importPath: "@/components/remocn/quote-hero",
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
    quoteDuration: {
      type: "number",
      default: 120,
      min: 0,
      max: 360,
      step: 1,
      description: "Quote duration",
      hiddenFromList: false,
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
  durationInFrames: 246,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
