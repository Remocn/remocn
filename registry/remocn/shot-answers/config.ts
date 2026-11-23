import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    stagger: {
      type: "number",
      default: 1.6,
      min: 0,
      max: 6,
      step: 0.2,
      description: "Word stagger",
      hiddenFromList: false,
    },
    answerAt: {
      type: "number",
      default: 58,
      min: 20,
      max: 100,
      step: 1,
      description: "Answer at (frame)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Onest" }),
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
