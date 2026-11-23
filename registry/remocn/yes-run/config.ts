import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const yesRunConfig: ComponentConfig = {
  componentName: "YesRun",
  importPath: "@/components/remocn/yes-run",
  lists: {
    questions: {
      default: [
        "Vertical?",
        "Captions?",
        "Your fonts?",
        "Dark mode?",
        "Transitions?",
        "Renders in CI?",
        "In your repo?",
        "Free?",
      ],
      description: "Questions",
    },
  },
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
      default: "Yes.",
      description: "Answer",
    },
    dwell: {
      type: "number",
      default: 32,
      min: 10,
      max: 90,
      step: 1,
      description: "First dwell (frames)",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 44,
      min: 0,
      max: 120,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Unbounded" }),
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
