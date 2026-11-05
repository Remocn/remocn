import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const diagonalSplitConfig: ComponentConfig = {
  componentName: "DiagonalSplit",
  importPath: "@/components/remocn/diagonal-split",
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
    from: {
      type: "text-content",
      default: "Built in a weekend",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "Launched on Monday",
      description: "To",
    },
    angle: {
      type: "number",
      default: 28,
      min: 0,
      max: 84,
      step: 1,
      description: "Angle",
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
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
