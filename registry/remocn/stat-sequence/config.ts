import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const statSequenceConfig: ComponentConfig = {
  componentName: "StatSequence",
  importPath: "@/components/remocn/stat-sequence",
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
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    eyebrow: {
      type: "text-content",
      default: "in numbers",
      description: "Eyebrow",
    },
    beat: {
      type: "number",
      default: 26,
      min: 0,
      max: 78,
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
