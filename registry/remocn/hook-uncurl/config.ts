import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    answerAt: {
      type: "number",
      default: 40,
      min: 10,
      max: 90,
      step: 1,
      description: "Answer at (frame)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Barlow Condensed" }),
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
