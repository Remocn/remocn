import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ledTickerConfig: ComponentConfig = {
  componentName: "LedTicker",
  importPath: "@/components/remocn/led-ticker",
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
    text: {
      type: "text-content",
      default: "remocn is live",
      description: "Text",
    },
    highlightWord: {
      type: "text-content",
      default: "live",
      description: "Highlight word",
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
