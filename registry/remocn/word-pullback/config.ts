import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const wordPullbackConfig: ComponentConfig = {
  componentName: "WordPullback",
  importPath: "@/components/remocn/word-pullback",
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
    before: {
      type: "text-content",
      default: "The",
      description: "Before",
    },
    accentWord: {
      type: "text-content",
      default: "cinematic",
      description: "Accent word",
    },
    after: {
      type: "text-content",
      default: "toolkit for every launch",
      description: "After",
    },
    fontWeight: {
      type: "number",
      default: 300,
      min: 100,
      max: 900,
      step: 100,
      description: "Weight",
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
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Inter Tight" }),
  },
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
