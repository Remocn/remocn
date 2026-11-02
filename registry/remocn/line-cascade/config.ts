import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const lineCascadeConfig: ComponentConfig = {
  componentName: "LineCascade",
  importPath: "@/components/remocn/line-cascade",
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
      default: "240",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "launch films rendered with remocn today",
      description: "Caption",
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
