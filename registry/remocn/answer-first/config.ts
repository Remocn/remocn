import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const answerFirstConfig: ComponentConfig = {
  componentName: "AnswerFirst",
  importPath: "@/components/remocn/answer-first",
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
    answer: {
      type: "text-content",
      default: "A pull request.",
      description: "Answer",
    },
    question: {
      type: "text-content",
      default: "Who made this video?",
      description: "Question",
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
