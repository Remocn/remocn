import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const flickSwapConfig: ComponentConfig = {
  componentName: "FlickSwap",
  importPath: "@/components/remocn/flick-swap",
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
    dwell: {
      type: "number",
      default: 28,
      min: 0,
      max: 84,
      step: 1,
      description: "Dwell",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 400,
      max: 500,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    blur: {
      type: "number",
      default: 1,
      min: 0,
      max: 2,
      step: 0.1,
      description: "Motion blur",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Bricolage Grotesque" }),
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
