import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const ringAlignConfig: ComponentConfig = {
  componentName: "RingAlign",
  importPath: "@/components/remocn/ring-align",
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
      default: "Aligned.",
      description: "Word",
    },
    rings: {
      type: "number",
      default: 6,
      min: 0,
      max: 18,
      step: 1,
      description: "Rings",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 8,
      min: 0,
      max: 24,
      step: 1,
      description: "Lock stagger",
      hiddenFromList: false,
    },
    dotSize: {
      type: "number",
      default: 3.1,
      min: 1,
      max: 8,
      step: 0.1,
      description: "Dot size",
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
