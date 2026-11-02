import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const hookUncurlConfig: ComponentConfig = {
  componentName: "HookUncurl",
  importPath: "@/components/remocn/hook-uncurl",
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
    question: {
      type: "text-content",
      default: "Why make the video?",
      description: "Question",
    },
    answer: {
      type: "text-content",
      default: "Just make the video.",
      description: "Answer",
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
