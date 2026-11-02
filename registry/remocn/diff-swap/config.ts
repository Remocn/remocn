import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const diffSwapConfig: ComponentConfig = {
  componentName: "DiffSwap",
  importPath: "@/components/remocn/diff-swap",
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
      default: "Keyframe every frame by hand.",
      description: "Before",
    },
    after: {
      type: "text-content",
      default: "Install the scene. Edit the props.",
      description: "After",
    },
    highlight: {
      type: "text-content",
      default: "Edit the props.",
      description: "Highlight",
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
