import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    altitude: {
      type: "number",
      default: 14.2,
      min: 0,
      max: 100,
      step: 0.1,
      description: "Altitude",
      hiddenFromList: false,
    },
    clockStart: {
      type: "number",
      default: 38,
      min: 0,
      max: 3540,
      step: 1,
      description: "Clock start (s)",
      hiddenFromList: false,
    },
    bandHold: {
      type: "number",
      default: 22,
      min: 0,
      max: 60,
      step: 1,
      description: "Banner hold (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Barlow Condensed" }),
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
