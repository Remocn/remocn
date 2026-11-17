import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const launchDateConfig: ComponentConfig = {
  componentName: "LaunchDate",
  importPath: "@/components/remocn/launch-date",
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
    label: {
      type: "text-content",
      default: "Coming soon",
      description: "Label",
    },
    order: {
      type: "enum",
      default: "month-day",
      variants: {
        "month-day": {},
        "day-month": {},
      },
      description: "Order",
    },
    fontWeight: {
      type: "number",
      default: 300,
      min: 100,
      max: 800,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Sora", grain: true }),
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
  durationInFrames: 195,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
