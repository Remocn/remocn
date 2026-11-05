import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rewriteBarsConfig: ComponentConfig = {
  componentName: "RewriteBars",
  importPath: "@/components/remocn/rewrite-bars",
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
      default: "rendered from code",
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
      default: 20,
      min: 0,
      max: 60,
      step: 1,
      description: "Hold",
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
  durationInFrames: 190,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
