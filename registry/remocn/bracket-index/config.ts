import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const bracketIndexConfig: ComponentConfig = {
  componentName: "BracketIndex",
  importPath: "@/components/remocn/bracket-index",
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
    prefix: {
      type: "text-content",
      default: "Motion for",
      description: "Prefix",
    },
    product: {
      type: "text-content",
      default: "remocn",
      description: "Product",
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
