import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const dotTypeConfig: ComponentConfig = {
  componentName: "DotType",
  importPath: "@/components/remocn/dot-type",
  lists: {
    words: {
      default: ["Think.", "Make.", "Ship."],
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    accentLast: {
      type: "boolean",
      default: true,
      description: "Accent last",
    },
    count: {
      type: "number",
      default: 1500,
      min: 0,
      max: 4500,
      step: 1,
      description: "Count",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 100,
      max: 800,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 22,
      min: 0,
      max: 60,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Sora", grain: true }),
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
  durationInFrames: 190,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
