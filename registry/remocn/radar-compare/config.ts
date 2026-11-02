import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const radarCompareConfig: ComponentConfig = {
  componentName: "RadarCompare",
  importPath: "@/components/remocn/radar-compare",
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
    brandLabel: {
      type: "text-content",
      default: "remocn",
      description: "Brand label",
    },
    competitorLabel: {
      type: "text-content",
      default: "Kitebase",
      description: "Competitor label",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
