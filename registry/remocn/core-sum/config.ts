import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const coreSumConfig: ComponentConfig = {
  componentName: "CoreSum",
  importPath: "@/components/remocn/core-sum",
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
      default: "frames per night, every core busy",
      description: "Label",
    },
    partLabel: {
      type: "text-content",
      default: "core",
      description: "Part label",
    },
    value: {
      type: "number",
      default: 2097152,
      min: 0,
      max: 6291456,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    parts: {
      type: "number",
      default: 8,
      min: 0,
      max: 24,
      step: 1,
      description: "Parts",
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
