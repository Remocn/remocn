import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const fuchidoriCountConfig: ComponentConfig = {
  componentName: "FuchidoriCount",
  importPath: "@/components/remocn/fuchidori-count",
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
      default: "captions styled without opening an editor",
      description: "Label",
    },
    value: {
      type: "number",
      default: 4096,
      min: 0,
      max: 12288,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    from: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    maxBorders: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Max borders",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
