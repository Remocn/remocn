import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const scissorsCutConfig: ComponentConfig = {
  componentName: "ScissorsCut",
  importPath: "@/components/remocn/scissors-cut",
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
    before: {
      type: "text-content",
      default: "Launch ",
      description: "Before",
    },
    cut: {
      type: "text-content",
      default: "next month",
      description: "Cut",
    },
    after: {
      type: "text-content",
      default: ".",
      description: "After",
    },
    replacement: {
      type: "text-content",
      default: "today",
      description: "Replacement",
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
  durationInFrames: 250,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
