import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const candleRallyConfig: ComponentConfig = {
  componentName: "CandleRally",
  importPath: "@/components/remocn/candle-rally",
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
    symbol: {
      type: "text-content",
      default: "RMCN",
      description: "Symbol",
    },
    headline: {
      type: "text-content",
      default: "All-time",
      description: "Headline",
    },
    headline2: {
      type: "text-content",
      default: "high",
      description: "Headline2",
    },
    price: {
      type: "number",
      default: 128.4,
      min: 0,
      max: 385.2,
      step: 0.01,
      description: "Price",
      hiddenFromList: false,
    },
    prevHigh: {
      type: "number",
      default: 112,
      min: 0,
      max: 336,
      step: 1,
      description: "Prev high",
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
