import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const freeAsInConfig: ComponentConfig = {
  componentName: "FreeAsIn",
  importPath: "@/components/remocn/free-as-in",
  lists: {
    glosses: {
      default: [
        "as in beer.",
        "as in speech.",
        "as in no seats.",
        "as in yours.",
      ],
      description: "Glosses",
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
    word: {
      type: "text-content",
      default: "Free",
      description: "Word",
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
    hold: {
      type: "number",
      default: 46,
      min: 10,
      max: 90,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Albert Sans" }),
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
