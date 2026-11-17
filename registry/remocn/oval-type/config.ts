import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const ovalTypeConfig: ComponentConfig = {
  componentName: "OvalType",
  importPath: "@/components/remocn/oval-type",
  lists: {
    tagline: {
      default: ["Make", "it", "move"],
      description: "Tagline",
    },
    words: {
      default: ["Plan", "Cut", "Edit", "Loop", "Sync", "Draft"],
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
    accentWord: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Accent word",
      hiddenFromList: false,
    },
    beat: {
      type: "number",
      default: 9,
      min: 0,
      max: 27,
      step: 1,
      description: "Beat",
      hiddenFromList: false,
    },
    landLen: {
      type: "number",
      default: 18,
      min: 4,
      max: 48,
      step: 1,
      description: "Land (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Sans", grain: true }),
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
