import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const splitMatchConfig: ComponentConfig = {
  componentName: "SplitMatch",
  importPath: "@/components/remocn/split-match",
  lists: {
    words: {
      default: ["build", "ship", "launch", "remocn"],
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
    hold: {
      type: "number",
      default: 16,
      min: 4,
      max: 40,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    step: {
      type: "number",
      default: 9,
      min: 3,
      max: 24,
      step: 1,
      description: "Step (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Bricolage Grotesque", grain: true }),
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
  durationInFrames: 145,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
