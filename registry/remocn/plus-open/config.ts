import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const plusOpenConfig: ComponentConfig = {
  componentName: "PlusOpen",
  importPath: "@/components/remocn/plus-open",
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
      default: "150",
      description: "Value",
    },
    label: {
      type: "text-content",
      default: "updates in this release",
      description: "Label",
    },
    next: {
      type: "text-content",
      default: "Here’s everything new.",
      description: "Next",
    },
    hold: {
      type: "number",
      default: 56,
      min: 20,
      max: 120,
      step: 2,
      description: "Hold before open (frames)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Sora", grain: true }),
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
