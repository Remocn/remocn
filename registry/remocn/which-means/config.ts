import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const whichMeansConfig: ComponentConfig = {
  componentName: "WhichMeans",
  importPath: "@/components/remocn/which-means",
  lists: {
    steps: {
      default: [
        "Every edit shows up as you type,",
        "you catch the typo before you render,",
        "the first render is the one you ship.",
      ],
      description: "Steps",
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
    name: {
      type: "text-content",
      default: "Live preview",
      description: "Name",
    },
    label: {
      type: "text-content",
      default: "New",
      description: "Label",
    },
    hinge: {
      type: "text-content",
      default: "which means",
      description: "Hinge",
    },
    stagger: {
      type: "number",
      default: 2,
      min: 0,
      max: 8,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 76,
      min: 20,
      max: 150,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Geologica" }),
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
  durationInFrames: 190,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
