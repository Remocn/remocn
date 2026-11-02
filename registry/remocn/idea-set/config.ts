import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ideaSetConfig: ComponentConfig = {
  componentName: "IdeaSet",
  importPath: "@/components/remocn/idea-set",
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
    highlight: {
      type: "text-content",
      default: "Keynote opener.",
      description: "Highlight",
    },
    hold: {
      type: "number",
      default: 18,
      min: 0,
      max: 54,
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
