import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tickerTapeConfig: ComponentConfig = {
  componentName: "TickerTape",
  importPath: "@/components/remocn/ticker-tape",
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
    price: {
      type: "text-content",
      default: "128.40",
      description: "Price",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    change: {
      type: "number",
      default: 12.4,
      min: 0,
      max: 37.2,
      step: 0.01,
      description: "Change",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
