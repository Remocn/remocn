import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const stockScrubConfig: ComponentConfig = {
  componentName: "StockScrub",
  importPath: "@/components/remocn/stock-scrub",
  lists: {
    lines: {
      default: [
        "Every tick, live.",
        "Drag through the day.",
        "Zoom out to the year.",
        "Buy in two taps.",
      ],
      description: "Lines",
      min: 4,
      max: 4,
    },
  },
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
    ctaLabel: {
      type: "text-content",
      default: "Buy",
      description: "Buy button",
    },
    orderLabel: {
      type: "text-content",
      default: "Review order",
      description: "Order button",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
