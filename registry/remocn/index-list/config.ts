import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const indexListConfig: ComponentConfig = {
  componentName: "IndexList",
  importPath: "@/components/remocn/index-list",
  lists: {
    items: {
      default: [
        "Transitions",
        "Captions",
        "Backgrounds",
        "Kinetic type",
        "Templates",
      ],
      description: "Items",
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
    title: {
      type: "text-content",
      default: "What’s inside 3.0",
      description: "Title",
    },
    countLabel: {
      type: "text-content",
      default: "features",
      description: "Count label",
    },
    highlight: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Highlight",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Row stagger",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
