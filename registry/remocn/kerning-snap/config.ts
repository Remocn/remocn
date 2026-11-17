import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const kerningSnapConfig: ComponentConfig = {
  componentName: "KerningSnap",
  importPath: "@/components/remocn/kerning-snap",
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
      default: "Typeset",
      description: "Word",
    },
    interval: {
      type: "number",
      default: 7,
      min: 0,
      max: 21,
      step: 1,
      description: "Interval",
      hiddenFromList: false,
    },
    firstSnap: {
      type: "number",
      default: 30,
      min: 0,
      max: 90,
      step: 1,
      description: "First snap (frame)",
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
