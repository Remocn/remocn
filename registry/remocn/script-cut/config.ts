import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const scriptCutConfig: ComponentConfig = {
  componentName: "ScriptCut",
  importPath: "@/components/remocn/script-cut",
  lists: {
    shots: {
      default: [
        "We wrote the launch as one line,",
        "cut it twice,",
        "and every piece became a shot.",
      ],
      description: "Shots",
    },
  },
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
    hold: {
      type: "number",
      default: 32,
      min: 0,
      max: 90,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 8,
      step: 1,
      description: "Word stagger",
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
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Epilogue" }),
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
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
