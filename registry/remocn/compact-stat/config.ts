import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const compactStatConfig: ComponentConfig = {
  componentName: "CompactStat",
  importPath: "@/components/remocn/compact-stat",
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
      default: "",
      description: "Prefix",
    },
    label: {
      type: "text-content",
      default: "frames rendered with remocn",
      description: "Label",
    },
    value: {
      type: "number",
      default: 1200000,
      min: 0,
      max: 3600000,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    decimals: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Decimals",
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
