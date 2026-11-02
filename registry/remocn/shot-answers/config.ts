import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shotAnswersConfig: ComponentConfig = {
  componentName: "ShotAnswers",
  importPath: "@/components/remocn/shot-answers",
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
      default: "What if your launch video were just another pull request?",
      description: "Question",
    },
    answer: {
      type: "text-content",
      default: "Your launch video is just another pull request.",
      description: "Answer",
    },
    url: {
      type: "text-content",
      default: "remocn.dev/studio",
      description: "Url",
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
