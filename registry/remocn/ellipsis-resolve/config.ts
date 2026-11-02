import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ellipsisResolveConfig: ComponentConfig = {
  componentName: "EllipsisResolve",
  importPath: "@/components/remocn/ellipsis-resolve",
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
    word: {
      type: "text-content",
      default: "Shipped",
      description: "Word",
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
  durationInFrames: 131,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
