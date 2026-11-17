import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const exactlyConfig: ComponentConfig = {
  componentName: "Exactly",
  importPath: "@/components/remocn/exactly",
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
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 30,
      min: 0,
      max: 90,
      step: 1,
      description: "Round hold (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Hubot Sans" }),
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
