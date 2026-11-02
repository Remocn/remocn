import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const themeFlipConfig: ComponentConfig = {
  componentName: "ThemeFlip",
  importPath: "@/components/remocn/theme-flip",
  controls: {
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    startTheme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Start theme",
    },
    showToggle: {
      type: "boolean",
      default: true,
      description: "Show toggle",
    },
    showCursor: {
      type: "boolean",
      default: true,
      description: "Show cursor",
    },
    reverse: {
      type: "boolean",
      default: false,
      description: "Reverse",
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
  durationInFrames: 112,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
