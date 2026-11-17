import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const passSwapConfig: ComponentConfig = {
  componentName: "PassSwap",
  importPath: "@/components/remocn/pass-swap",
  lists: {
    lines: {
      default: ["Copy the code.", "Own every frame.", "Ship the film."],
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    shape: {
      type: "enum",
      default: "mixed",
      variants: {
        slab: {},
        disc: {},
        mixed: {},
      },
      description: "Shape",
    },
    accentLastWord: {
      type: "boolean",
      default: true,
      description: "Accent last word",
    },
    passLength: {
      type: "number",
      default: 30,
      min: 10,
      max: 60,
      step: 1,
      description: "Pass length (frames)",
      hiddenFromList: false,
    },
    passGap: {
      type: "number",
      default: 46,
      min: 20,
      max: 90,
      step: 1,
      description: "Pass gap (frames)",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Hanken Grotesk", grain: true }),
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
