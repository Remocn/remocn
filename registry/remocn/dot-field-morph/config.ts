import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const dotFieldMorphConfig: ComponentConfig = {
  componentName: "DotFieldMorph",
  importPath: "@/components/remocn/dot-field-morph",
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
    count: {
      type: "number",
      default: 2000,
      min: 0,
      max: 6000,
      step: 1,
      description: "Count",
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
  durationInFrames: 250,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
