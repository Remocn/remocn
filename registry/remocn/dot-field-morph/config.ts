import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const dotFieldMorphConfig: ComponentConfig = {
  componentName: "DotFieldMorph",
  importPath: "@/components/remocn/dot-field-morph",
  lists: {
    labels: {
      default: ["Animations", "Transitions", "Captions", ""],
      description: "Labels",
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
    count: {
      type: "number",
      default: 2000,
      min: 0,
      max: 6000,
      step: 1,
      description: "Count",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 22,
      min: 0,
      max: 90,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    morph: {
      type: "number",
      default: 30,
      min: 10,
      max: 90,
      step: 1,
      description: "Morph (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Manrope", grain: true }),
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
  durationInFrames: 250,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
