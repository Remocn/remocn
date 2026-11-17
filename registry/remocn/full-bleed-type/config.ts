import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const fullBleedTypeConfig: ComponentConfig = {
  componentName: "FullBleedType",
  importPath: "@/components/remocn/full-bleed-type",
  lists: {
    words: {
      default: ["NO", "DAYS", "OFF", "SHIP"],
      description: "Words",
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
    beat: {
      type: "number",
      default: 11,
      min: 0,
      max: 33,
      step: 1,
      description: "Beat",
      hiddenFromList: false,
    },
    slam: {
      type: "number",
      default: 8,
      min: 2,
      max: 24,
      step: 1,
      description: "Slam (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Barlow Condensed" }),
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
  durationInFrames: 96,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
