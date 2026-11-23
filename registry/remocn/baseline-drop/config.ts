import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const baselineDropConfig: ComponentConfig = {
  componentName: "BaselineDrop",
  importPath: "@/components/remocn/baseline-drop",
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
    text: {
      type: "text-content",
      default: "Ship the story.",
      description: "Text",
    },
    stagger: {
      type: "number",
      default: 11,
      min: 0,
      max: 33,
      step: 1,
      description: "Stagger",
      hiddenFromList: false,
    },
    fall: {
      type: "number",
      default: 15,
      min: 4,
      max: 30,
      step: 1,
      description: "Fall (frames)",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 20,
      min: 0,
      max: 60,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Schibsted Grotesk", grain: true }),
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
