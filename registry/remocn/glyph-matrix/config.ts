import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const glyphMatrixConfig: ComponentConfig = {
  componentName: "GlyphMatrix",
  importPath: "@/components/remocn/glyph-matrix",
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
    label: {
      type: "text-content",
      default: "remocn",
      description: "Label",
    },
    countStep: {
      type: "number",
      default: 16,
      min: 6,
      max: 30,
      step: 1,
      description: "Count step (frames)",
      hiddenFromList: false,
    },
    typeStep: {
      type: "number",
      default: 2.5,
      min: 0.5,
      max: 8,
      step: 0.5,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Manrope" }),
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
