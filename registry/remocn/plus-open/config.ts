import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const plusOpenConfig: ComponentConfig = {
  componentName: "PlusOpen",
  importPath: "@/components/remocn/plus-open",
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
      default: "150",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "updates in this release",
      description: "Label",
    },
    next: {
      type: "text-content",
      default: "Here’s everything new.",
      description: "Next",
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
