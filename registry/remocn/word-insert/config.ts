import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const wordInsertConfig: ComponentConfig = {
  componentName: "WordInsert",
  importPath: "@/components/remocn/word-insert",
  lists: {
    states: {
      default: [
        "Launch videos.",
        "Launch videos, as code.",
        "Beautiful launch videos, as code.",
      ],
      description: "States",
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
    beat: {
      type: "number",
      default: 50,
      min: 24,
      max: 100,
      step: 1,
      description: "State beat (frames)",
      hiddenFromList: false,
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Manrope", grain: true }),
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
  durationInFrames: 174,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
