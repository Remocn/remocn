import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const stripeMaskConfig: ComponentConfig = {
  componentName: "StripeMask",
  importPath: "@/components/remocn/stripe-mask",
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
      default: "Faster. Every frame.",
      description: "Title",
    },
    slant: {
      type: "number",
      default: 18,
      min: 0,
      max: 54,
      step: 1,
      description: "Slant",
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
