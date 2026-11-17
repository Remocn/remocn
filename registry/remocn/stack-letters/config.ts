import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const stackLettersConfig: ComponentConfig = {
  componentName: "StackLetters",
  importPath: "@/components/remocn/stack-letters",
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
    word: {
      type: "text-content",
      default: "STACK",
      description: "Word",
    },
    stagger: {
      type: "number",
      default: 8,
      min: 2,
      max: 20,
      step: 1,
      description: "Drop stagger",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 9,
      min: 0,
      max: 40,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Space Grotesk", grain: true }),
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
