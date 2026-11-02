import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const cutStatConfig: ComponentConfig = {
  componentName: "CutStat",
  importPath: "@/components/remocn/cut-stat",
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
    prefix: {
      type: "text-content",
      default: "−",
      description: "Prefix",
    },
    suffix: {
      type: "text-content",
      default: "%",
      description: "Suffix",
    },
    label: {
      type: "text-content",
      default: "less time to a finished cut",
      description: "Label",
    },
    caption: {
      type: "text-content",
      default: "vs. keyframing every scene by hand",
      description: "Caption",
    },
    fromLabel: {
      type: "text-content",
      default: "Before",
      description: "From label",
    },
    toLabel: {
      type: "text-content",
      default: "With remocn",
      description: "To label",
    },
    value: {
      type: "number",
      default: 44,
      min: 0,
      max: 132,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    decimals: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "Decimals",
      hiddenFromList: false,
    },
  },
  durationInFrames: 115,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
