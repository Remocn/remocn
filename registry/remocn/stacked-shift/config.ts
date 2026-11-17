import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const stackedShiftConfig: ComponentConfig = {
  componentName: "StackedShift",
  importPath: "@/components/remocn/stacked-shift",
  lists: {
    years: {
      default: ["2023", "2024", "2025"],
      description: "Years",
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
    caption: {
      type: "text-content",
      default: "of launch videos",
      description: "Caption",
    },
    highlight: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "Highlight",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 54,
      min: 44,
      max: 120,
      step: 1,
      description: "Year hold (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Figtree", grain: true }),
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
  durationInFrames: 178,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
