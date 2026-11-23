import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const spotlightTextConfig: ComponentConfig = {
  componentName: "SpotlightText",
  importPath: "@/components/remocn/spotlight-text",
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
    title: {
      type: "text-content",
      default: "Launch videos, in code.",
      description: "Title",
    },
    eyebrow: {
      type: "text-content",
      default: "remocn 2.0",
      description: "Eyebrow",
    },
    sweep: {
      type: "number",
      default: 78,
      min: 30,
      max: 150,
      step: 1,
      description: "Sweep (frames)",
      hiddenFromList: false,
    },
    spotSize: {
      type: "number",
      default: 1.25,
      min: 0.5,
      max: 3,
      step: 0.05,
      description: "Spotlight size",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
