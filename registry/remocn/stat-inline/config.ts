import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const statInlineConfig: ComponentConfig = {
  componentName: "StatInline",
  importPath: "@/components/remocn/stat-inline",
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
    value: {
      type: "text-content",
      default: "12,480",
      description: "Value",
    },
    text: {
      type: "text-content",
      default: "Builders shipped {value} launch videos with remocn this year.",
      description: "Text",
    },
    label: {
      type: "text-content",
      default: "Launch videos shipped",
      description: "Label",
    },
    align: {
      type: "enum",
      default: "left",
      variants: {
        left: {},
        center: {},
      },
      description: "Align",
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
