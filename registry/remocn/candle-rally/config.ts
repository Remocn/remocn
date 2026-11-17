import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    levelLabel: {
      type: "text-content",
      default: "PREV HIGH",
      description: "Level label",
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
    fontWeight: {
      type: "number",
      default: 500,
      min: 100,
      max: 900,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Barlow Condensed" }),
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
