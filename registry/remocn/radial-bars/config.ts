import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const radialBarsConfig: ComponentConfig = {
  componentName: "RadialBars",
  importPath: "@/components/remocn/radial-bars",
  lists: {
    ticks: {
      default: ["00:00", "06:00", "12:00", "18:00"],
      description: "Ticks",
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
    value: {
      type: "text-content",
      default: "2.4M",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "renders in the peak hour",
      description: "Label",
    },
    sweep: {
      type: "number",
      default: 54,
      min: 10,
      max: 120,
      step: 1,
      description: "Sweep (frames)",
      hiddenFromList: false,
    },
    group: {
      type: "number",
      default: 5,
      min: 1,
      max: 15,
      step: 2,
      description: "Group size",
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
