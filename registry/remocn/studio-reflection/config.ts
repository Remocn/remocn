import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const studioReflectionConfig: ComponentConfig = {
  componentName: "StudioReflection",
  importPath: "@/components/remocn/studio-reflection",
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
      default: "250+",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "launch-ready scenes, one command away",
      description: "Label",
    },
    eyebrow: {
      type: "text-content",
      default: "In the library",
      description: "Eyebrow",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
