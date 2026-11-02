import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const dynamicLetterConfig: ComponentConfig = {
  componentName: "DynamicLetter",
  importPath: "@/components/remocn/dynamic-letter",
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
    text: {
      type: "text-content",
      default: "emocn",
      description: "Text",
    },
    final: {
      type: "text-content",
      default: "overflow",
      description: "Final",
    },
    beat: {
      type: "number",
      default: 8,
      min: 0,
      max: 24,
      step: 1,
      description: "Beat",
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
