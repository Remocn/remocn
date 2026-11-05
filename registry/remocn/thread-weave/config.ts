import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const threadWeaveConfig: ComponentConfig = {
  componentName: "ThreadWeave",
  importPath: "@/components/remocn/thread-weave",
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
      default: "24",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "frames per second",
      description: "Caption",
    },
    motif: {
      type: "enum",
      default: "value",
      variants: {
        value: {},
        mark: {},
      },
      description: "Motif",
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
