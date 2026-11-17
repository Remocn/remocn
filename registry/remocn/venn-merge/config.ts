import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const vennMergeConfig: ComponentConfig = {
  componentName: "VennMerge",
  importPath: "@/components/remocn/venn-merge",
  lists: {
    sets: {
      default: ["Design", "Code"],
      description: "Sets",
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
    center: {
      type: "text-content",
      default: "remocn",
      description: "Center",
    },
    caption: {
      type: "text-content",
      default: "Motion design, written as code.",
      description: "Caption",
    },
    slide: {
      type: "number",
      default: 40,
      min: 10,
      max: 90,
      step: 1,
      description: "Slide (frames)",
      hiddenFromList: false,
    },
    ringWidth: {
      type: "number",
      default: 2,
      min: 1,
      max: 8,
      step: 0.5,
      description: "Ring width",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Serif", grain: true }),
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
