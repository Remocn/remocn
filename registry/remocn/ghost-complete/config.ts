import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ghostCompleteConfig: ComponentConfig = {
  componentName: "GhostComplete",
  importPath: "@/components/remocn/ghost-complete",
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
      default: "Launch notes",
      description: "Title",
    },
    typed: {
      type: "text-content",
      default: "Ship the",
      description: "Typed",
    },
    keepLastFill: {
      type: "boolean",
      default: true,
      description: "Keep last fill",
    },
    showLogo: {
      type: "boolean",
      default: true,
      description: "Show logo",
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
