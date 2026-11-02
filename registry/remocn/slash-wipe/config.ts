import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const slashWipeConfig: ComponentConfig = {
  componentName: "SlashWipe",
  importPath: "@/components/remocn/slash-wipe",
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
    every: {
      type: "number",
      default: 56,
      min: 0,
      max: 168,
      step: 1,
      description: "Every",
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
  durationInFrames: 110,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
