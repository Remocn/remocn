import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const spotlightTextConfig: ComponentConfig = {
  componentName: "SpotlightText",
  importPath: "@/components/remocn/spotlight-text",
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
    title: {
      type: "text-content",
      default: "Launch videos, in code.",
      description: "Title",
    },
    eyebrow: {
      type: "text-content",
      default: "remocn 2.0",
      description: "Eyebrow",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
