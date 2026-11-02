import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const layoutSwapConfig: ComponentConfig = {
  componentName: "LayoutSwap",
  importPath: "@/components/remocn/layout-swap",
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
    highlight: {
      type: "text-content",
      default: "ready to install.",
      description: "Highlight",
    },
    align: {
      type: "enum",
      default: "center",
      variants: {
        center: {},
        left: {},
      },
      description: "Align",
    },
    hold: {
      type: "number",
      default: 28,
      min: 0,
      max: 84,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
    },
    move: {
      type: "number",
      default: 28,
      min: 0,
      max: 84,
      step: 1,
      description: "Move",
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
