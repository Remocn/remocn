import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const moireRevealConfig: ComponentConfig = {
  componentName: "MoireReveal",
  importPath: "@/components/remocn/moire-reveal",
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
      default: "10×",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "faster first frame on remocn render",
      description: "Caption",
    },
    shape: {
      type: "enum",
      default: "text",
      variants: {
        text: {},
        mark: {},
      },
      description: "Shape",
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
