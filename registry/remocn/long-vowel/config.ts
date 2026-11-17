import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const longVowelConfig: ComponentConfig = {
  componentName: "LongVowel",
  importPath: "@/components/remocn/long-vowel",
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
      default: "Way",
      description: "Word",
    },
    letter: {
      type: "text-content",
      default: "",
      description: "Letter",
    },
    rest: {
      type: "text-content",
      default: "less keyframing.",
      description: "Rest",
    },
    repeat: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Repeat",
      hiddenFromList: false,
    },
    stretchAt: {
      type: "number",
      default: 28,
      min: 0,
      max: 90,
      step: 1,
      description: "Stretch at (frame)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Copy stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Fraunces", grain: true }),
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
