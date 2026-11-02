import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const looksLikeThisConfig: ComponentConfig = {
  componentName: "LooksLikeThis",
  importPath: "@/components/remocn/looks-like-this",
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
    lead: {
      type: "text-content",
      default: "Your next launch looks like",
      description: "Lead",
    },
    word: {
      type: "text-content",
      default: "this",
      description: "Word",
    },
    end: {
      type: "text-content",
      default: ".",
      description: "End",
    },
    duration: {
      type: "text-content",
      default: "0:30",
      description: "Duration",
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
