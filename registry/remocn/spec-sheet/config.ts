import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const specSheetConfig: ComponentConfig = {
  componentName: "SpecSheet",
  importPath: "@/components/remocn/spec-sheet",
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
      default: "Tech specs",
      description: "Title",
    },
    name: {
      type: "text-content",
      default: "3.0",
      description: "Name",
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
      default: 5,
      min: 0,
      max: 12,
      step: 1,
      description: "Row stagger",
      hiddenFromList: false,
    },
    expandAt: {
      type: "number",
      default: 62,
      min: 20,
      max: 100,
      step: 1,
      description: "Expand at (frame)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Sans", grain: true }),
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
