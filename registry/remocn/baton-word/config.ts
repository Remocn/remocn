import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const batonWordConfig: ComponentConfig = {
  componentName: "BatonWord",
  importPath: "@/components/remocn/baton-word",
  lists: {
    scenes: {
      default: [
        "The app is ready for launch.",
        "Launch day needs a film.",
        "Film it in code.",
      ],
      description: "Lines",
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
    fontWeight: {
      type: "number",
      default: 500,
      min: 400,
      max: 800,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
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
    travel: {
      type: "number",
      default: 24,
      min: 8,
      max: 60,
      step: 1,
      description: "Baton travel (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Syne" }),
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
  durationInFrames: 210,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
