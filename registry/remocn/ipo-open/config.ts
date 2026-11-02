import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ipoOpenConfig: ComponentConfig = {
  componentName: "IpoOpen",
  importPath: "@/components/remocn/ipo-open",
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
    label: {
      type: "text-content",
      default: "Listed today",
      description: "Label",
    },
    openTime: {
      type: "text-content",
      default: "09:30",
      description: "Open time",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    ipoPrice: {
      type: "number",
      default: 18,
      min: 0,
      max: 54,
      step: 1,
      description: "Ipo price",
      hiddenFromList: false,
    },
    openPrice: {
      type: "number",
      default: 42.6,
      min: 0,
      max: 127.8,
      step: 0.01,
      description: "Open price",
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
