import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const carryCountConfig: ComponentConfig = {
  componentName: "CarryCount",
  importPath: "@/components/remocn/carry-count",
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
      default: "scenes students\nbuilt in week one",
      description: "Label",
    },
    value: {
      type: "number",
      default: 13580,
      min: 0,
      max: 40740,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    from: {
      type: "number",
      default: 2855,
      min: 0,
      max: 8565,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    steps: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Steps",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
