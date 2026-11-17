import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const sequelNumeralConfig: ComponentConfig = {
  componentName: "SequelNumeral",
  importPath: "@/components/remocn/sequel-numeral",
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
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    numeral: {
      type: "text-content",
      default: "2",
      description: "Numeral",
    },
    tagline: {
      type: "text-content",
      default: "Part two. Out now.",
      description: "Tagline",
    },
    hold: {
      type: "number",
      default: 32,
      min: 8,
      max: 80,
      step: 2,
      description: "Superscript hold (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#E60012",
      description: "Accent",
    },
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
