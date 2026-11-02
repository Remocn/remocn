import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const peekShutConfig: ComponentConfig = {
  componentName: "PeekShut",
  importPath: "@/components/remocn/peek-shut",
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
      default: "Want a peek?",
      description: "Question",
    },
    refusal: {
      type: "text-content",
      default: "That’s all you get.",
      description: "Refusal",
    },
    when: {
      type: "text-content",
      default: "The rest, Monday.",
      description: "When",
    },
    focusY: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1.5,
      step: 0.01,
      description: "Focus y",
      hiddenFromList: false,
    },
    zoom: {
      type: "number",
      default: 3.2,
      min: 0,
      max: 9.6,
      step: 0.01,
      description: "Zoom",
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
