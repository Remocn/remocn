import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const romanEditionConfig: ComponentConfig = {
  componentName: "RomanEdition",
  importPath: "@/components/remocn/roman-edition",
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
    eyebrow: {
      type: "text-content",
      default: "Launch Week",
      description: "Eyebrow",
    },
    tagline: {
      type: "text-content",
      default: "Five days of new scenes, one every morning.",
      description: "Tagline",
    },
    showNumber: {
      type: "boolean",
      default: true,
      description: "Show number",
    },
    value: {
      type: "number",
      default: 14,
      min: 0,
      max: 42,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    from: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "From",
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
