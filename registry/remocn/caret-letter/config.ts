import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const caretLetterConfig: ComponentConfig = {
  componentName: "CaretLetter",
  importPath: "@/components/remocn/caret-letter",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    word: {
      type: "text-content",
      default: "launch",
      description: "Word",
    },
    subline: {
      type: "text-content",
      default: "Animated components for your next release.",
      description: "Subline",
    },
    stemIndex: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "Stem index",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 300,
      min: 100,
      max: 700,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    typeLength: {
      type: "number",
      default: 46,
      min: 10,
      max: 120,
      step: 1,
      description: "Typing (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Inter Tight" }),
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
  durationInFrames: 225,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
