import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const liveTickerConfig: ComponentConfig = {
  componentName: "LiveTicker",
  importPath: "@/components/remocn/live-ticker",
  lists: {
    feed: {
      default: [
        "Lumen",
        "Kite",
        "Orbit",
        "Halden",
        "Nova",
        "Ferro",
        "Vela",
        "Pico",
      ],
      description: "Feed",
    },
  },
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
    unit: {
      type: "text-content",
      default: "renders",
      description: "Unit",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    kicker: {
      type: "text-content",
      default: "Live",
      description: "Kicker",
    },
    connector: {
      type: "text-content",
      default: "on",
      description: "Connector",
    },
    value: {
      type: "number",
      default: 12480312,
      min: 0,
      max: 37440936,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 300,
      min: 300,
      max: 400,
      step: 100,
      description: "Figure weight",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Geist", grain: true }),
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
