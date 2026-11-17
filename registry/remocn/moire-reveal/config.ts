import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const moireRevealConfig: ComponentConfig = {
  componentName: "MoireReveal",
  importPath: "@/components/remocn/moire-reveal",
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
    value: {
      type: "text-content",
      default: "10×",
      description: "Value",
    },
    caption: {
      type: "text-content",
      default: "faster first frame on remocn render",
      description: "Caption",
    },
    shape: {
      type: "enum",
      default: "text",
      variants: {
        text: {},
        mark: {},
      },
      description: "Shape",
    },
    lineSpacing: {
      type: "number",
      default: 7,
      min: 4,
      max: 14,
      step: 0.5,
      description: "Line spacing",
      hiddenFromList: false,
    },
    angle: {
      type: "number",
      default: 11,
      min: 0,
      max: 45,
      step: 1,
      description: "Start angle",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Geist", grain: true }),
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
