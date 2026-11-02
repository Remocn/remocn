import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const maxQConfig: ComponentConfig = {
  componentName: "MaxQ",
  importPath: "@/components/remocn/max-q",
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
    speedLabel: {
      type: "text-content",
      default: "Speed",
      description: "Speed label",
    },
    speedUnit: {
      type: "text-content",
      default: "km/h",
      description: "Speed unit",
    },
    altitudeLabel: {
      type: "text-content",
      default: "Altitude",
      description: "Altitude label",
    },
    altitudeUnit: {
      type: "text-content",
      default: "km",
      description: "Altitude unit",
    },
    event: {
      type: "text-content",
      default: "Max Q",
      description: "Event",
    },
    eventDetail: {
      type: "text-content",
      default: "Maximum dynamic pressure",
      description: "Event detail",
    },
    status: {
      type: "text-content",
      default: "Nominal",
      description: "Status",
    },
    velocity: {
      type: "number",
      default: 1880,
      min: 0,
      max: 5640,
      step: 1,
      description: "Velocity",
      hiddenFromList: false,
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
