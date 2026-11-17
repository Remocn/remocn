import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const strobeWordsConfig: ComponentConfig = {
  componentName: "StrobeWords",
  importPath: "@/components/remocn/strobe-words",
  lists: {
    words: {
      default: ["Plan.", "Write.", "Render.", "Ship."],
      description: "Words",
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
      default: 6,
      min: 2,
      max: 16,
      step: 1,
      description: "First cut (frames)",
      hiddenFromList: false,
    },
    cuts: {
      type: "number",
      default: 13,
      min: 3,
      max: 30,
      step: 1,
      description: "Cuts",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({
      font: "Sora",
      ink: false,
      background: false,
      grain: true,
    }),
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
  durationInFrames: 115,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
