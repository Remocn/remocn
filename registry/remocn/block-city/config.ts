import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const blockCityConfig: ComponentConfig = {
  componentName: "BlockCity",
  importPath: "@/components/remocn/block-city",
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
    prefix: {
      type: "text-content",
      default: "+",
      description: "Prefix",
    },
    suffix: {
      type: "text-content",
      default: "%",
      description: "Suffix",
    },
    caption: {
      type: "text-content",
      default: "renders",
      description: "Caption",
    },
    value: {
      type: "number",
      default: 340,
      min: 0,
      max: 1020,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 400,
      min: 100,
      max: 900,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    countUp: {
      type: "number",
      default: 40,
      min: 2,
      max: 120,
      step: 2,
      description: "Count-up (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Sora", grain: true }),
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
