import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    moveAt: {
      type: "number",
      default: 34,
      min: 14,
      max: 80,
      step: 1,
      description: "Move at (frame)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Question word stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Outfit" }),
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
