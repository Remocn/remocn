import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const slitScanConfig: ComponentConfig = {
  componentName: "SlitScan",
  importPath: "@/components/remocn/slit-scan",
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
      default: "Faster.",
      description: "Word",
    },
    caption: {
      type: "text-content",
      default: "First render in 1.8s, down from 4.7s",
      description: "Caption",
    },
    slices: {
      type: "number",
      default: 120,
      min: 0,
      max: 360,
      step: 1,
      description: "Slices",
      hiddenFromList: false,
    },
    trail: {
      type: "number",
      default: 34,
      min: 0,
      max: 80,
      step: 1,
      description: "Trail (frames)",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 700,
      step: 100,
      description: "Weight",
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
