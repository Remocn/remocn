import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const measureDimConfig: ComponentConfig = {
  componentName: "MeasureDim",
  importPath: "@/components/remocn/measure-dim",
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
    label: {
      type: "text-content",
      default: "remocn",
      description: "Label",
    },
    value: {
      type: "text-content",
      default: "184 fps",
      description: "Value",
    },
    before: {
      type: "text-content",
      default: "60 fps",
      description: "Before",
    },
    beforeLabel: {
      type: "text-content",
      default: "Before",
      description: "Before label",
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
