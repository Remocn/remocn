import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    scroll: {
      type: "number",
      default: 54,
      min: 10,
      max: 120,
      step: 2,
      description: "Scroll (frames)",
      hiddenFromList: false,
    },
    dotSize: {
      type: "number",
      default: 0.45,
      min: 0.3,
      max: 0.6,
      step: 0.01,
      description: "Dot size",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ grain: true }),
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
