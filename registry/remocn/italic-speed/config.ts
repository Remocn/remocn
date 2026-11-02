import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const italicSpeedConfig: ComponentConfig = {
  componentName: "ItalicSpeed",
  importPath: "@/components/remocn/italic-speed",
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
      default: "FASTER",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "Ship at race pace.",
      description: "Subtitle",
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
  durationInFrames: 84,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
