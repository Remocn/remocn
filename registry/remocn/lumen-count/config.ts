import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const lumenCountConfig: ComponentConfig = {
  componentName: "LumenCount",
  importPath: "@/components/remocn/lumen-count",
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
    suffix: {
      type: "text-content",
      default: "",
      description: "Suffix",
    },
    label: {
      type: "text-content",
      default: "components, ready to light up your launch video",
      description: "Label",
    },
    eyebrow: {
      type: "text-content",
      default: "",
      description: "Eyebrow",
    },
    value: {
      type: "number",
      default: 200,
      min: 0,
      max: 600,
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
