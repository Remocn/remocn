import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const shapeMorphOConfig: ComponentConfig = {
  componentName: "ShapeMorphO",
  importPath: "@/components/remocn/shape-morph-o",
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
      default: "remocn",
      description: "Word",
    },
    mark: {
      type: "boolean",
      default: true,
      description: "Mark",
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 800,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    beat: {
      type: "number",
      default: 16,
      min: 6,
      max: 30,
      step: 1,
      description: "Shape beat (frames)",
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
