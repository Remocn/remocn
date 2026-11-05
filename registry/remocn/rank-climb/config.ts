import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rankClimbConfig: ComponentConfig = {
  componentName: "RankClimb",
  importPath: "@/components/remocn/rank-climb",
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
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    eyebrow: {
      type: "text-content",
      default: "Product of the day",
      description: "Eyebrow",
    },
    caption: {
      type: "text-content",
      default: "on Product Hunt",
      description: "Caption",
    },
    from: {
      type: "number",
      default: 8,
      min: 0,
      max: 24,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    to: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "To",
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
