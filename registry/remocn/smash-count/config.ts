import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const smashCountConfig: ComponentConfig = {
  componentName: "SmashCount",
  importPath: "@/components/remocn/smash-count",
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
      default: "scenes, zero keyframes",
      description: "Label",
    },
    value: {
      type: "number",
      default: 64,
      min: 0,
      max: 192,
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
    cuts: {
      type: "number",
      default: 6,
      min: 0,
      max: 18,
      step: 1,
      description: "Cuts",
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
