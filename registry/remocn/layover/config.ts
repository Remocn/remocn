import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const layoverConfig: ComponentConfig = {
  componentName: "Layover",
  importPath: "@/components/remocn/layover",
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
    from: {
      type: "text-content",
      default: "Write it",
      description: "From",
    },
    word: {
      type: "text-content",
      default: "here.",
      description: "Word",
    },
    to: {
      type: "text-content",
      default: "Plays",
      description: "To",
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
