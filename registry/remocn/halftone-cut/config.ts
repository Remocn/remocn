import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const halftoneCutConfig: ComponentConfig = {
  componentName: "HalftoneCut",
  importPath: "@/components/remocn/halftone-cut",
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
      default: "Draft one",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "Final cut",
      description: "To",
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
  durationInFrames: 108,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
