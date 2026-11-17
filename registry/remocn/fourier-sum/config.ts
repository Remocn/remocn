import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const fourierSumConfig: ComponentConfig = {
  componentName: "FourierSum",
  importPath: "@/components/remocn/fourier-sum",
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
      default: "Many parts. One signal.",
      description: "Title",
    },
    periods: {
      type: "number",
      default: 2,
      min: 0,
      max: 10,
      step: 1,
      description: "Periods",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 11,
      min: 0,
      max: 30,
      step: 1,
      description: "Merge stagger",
      hiddenFromList: false,
    },
    waveFill: {
      type: "boolean",
      default: true,
      description: "Wave fill",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Newsreader", grain: true }),
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
