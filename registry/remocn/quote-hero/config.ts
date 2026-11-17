import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    stagger: {
      type: "number",
      default: 5,
      min: 0,
      max: 16,
      step: 1,
      description: "Line stagger",
      hiddenFromList: false,
    },
    sweep: {
      type: "number",
      default: 18,
      min: 6,
      max: 48,
      step: 1,
      description: "Highlight sweep (frames)",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Instrument Serif", grain: true }),
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
