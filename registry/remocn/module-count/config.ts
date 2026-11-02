import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const moduleCountConfig: ComponentConfig = {
  componentName: "ModuleCount",
  importPath: "@/components/remocn/module-count",
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
    prefix: {
      type: "text-content",
      default: "",
      description: "Prefix",
    },
    suffix: {
      type: "text-content",
      default: "",
      description: "Suffix",
    },
    label: {
      type: "text-content",
      default: "Scenes, every one snapped to a single grid",
      description: "Label",
    },
    value: {
      type: "number",
      default: 48,
      min: 0,
      max: 144,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    from: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    steps: {
      type: "number",
      default: 11,
      min: 0,
      max: 33,
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
