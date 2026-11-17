import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const factorOutConfig: ComponentConfig = {
  componentName: "FactorOut",
  importPath: "@/components/remocn/factor-out",
  lists: {
    heads: {
      default: ["Write the scenes", "Pick the colors", "Fix the typos"],
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
    tail: {
      type: "text-content",
      default: "in your editor.",
      description: "Tail",
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 400,
      max: 500,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 8,
      min: 0,
      max: 24,
      step: 1,
      description: "Line stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Rubik" }),
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
  durationInFrames: 190,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
