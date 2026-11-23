import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const pointHopConfig: ComponentConfig = {
  componentName: "PointHop",
  importPath: "@/components/remocn/point-hop",
  lists: {
    prefixes: { default: ["", "m", "µ", "n"], description: "Prefixes" },
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
    unit: {
      type: "text-content",
      default: "s",
      description: "Unit",
    },
    label: {
      type: "text-content",
      default: "scene refresh after a prop change",
      description: "Label",
    },
    value: {
      type: "number",
      default: 3.42e-5,
      min: 0,
      max: 1,
      step: 0.01,
      description: "Value",
      hiddenFromList: false,
    },
    hop: {
      type: "number",
      default: 7,
      min: 2,
      max: 20,
      step: 1,
      description: "Hop (frames)",
      hiddenFromList: false,
    },
    rest: {
      type: "number",
      default: 12,
      min: 0,
      max: 40,
      step: 1,
      description: "Rest between steps (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Geist" }),
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
