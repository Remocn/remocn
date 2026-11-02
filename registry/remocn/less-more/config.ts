import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const lessMoreConfig: ComponentConfig = {
  componentName: "LessMore",
  importPath: "@/components/remocn/less-more",
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
    less: {
      type: "text-content",
      default: "Less explaining.",
      description: "Less",
    },
    more: {
      type: "text-content",
      default: "More showing.",
      description: "More",
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
