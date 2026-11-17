import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const screenshotTourConfig: ComponentConfig = {
  componentName: "ScreenshotTour",
  importPath: "@/components/remocn/screenshot-tour",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    pullBack: {
      type: "boolean",
      default: true,
      description: "Pull back",
    },
    framesPerStop: {
      type: "number",
      default: 45,
      min: 0,
      max: 135,
      step: 1,
      description: "Frames per stop",
      hiddenFromList: false,
    },
    dim: {
      type: "number",
      default: 0.55,
      min: 0,
      max: 1.65,
      step: 0.01,
      description: "Dim",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
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
  durationInFrames: 215,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
