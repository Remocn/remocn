import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const stockScrubConfig: ComponentConfig = {
  componentName: "StockScrub",
  importPath: "@/components/remocn/stock-scrub",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ticker: {
      type: "text-content",
      default: "RMCN",
      description: "Ticker",
    },
    name: {
      type: "text-content",
      default: "remocn Inc.",
      description: "Name",
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
  durationInFrames: 270,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
