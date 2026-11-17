import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const quadtreeMarkConfig: ComponentConfig = {
  componentName: "QuadtreeMark",
  importPath: "@/components/remocn/quadtree-mark",
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
      default: "emocn",
      description: "Name",
    },
    stagger: {
      type: "number",
      default: 2.5,
      min: 0,
      max: 8,
      step: 0.5,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    depth: {
      type: "number",
      default: 6,
      min: 3,
      max: 6,
      step: 1,
      description: "Depth",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ grain: true }),
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
