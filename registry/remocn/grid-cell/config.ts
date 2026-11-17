import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const gridCellConfig: ComponentConfig = {
  componentName: "GridCell",
  importPath: "@/components/remocn/grid-cell",
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
      default: "Introducing remocn 2.0",
      description: "Title",
    },
    label: {
      type: "text-content",
      default: "v2.0",
      description: "Label",
    },
    stagger: {
      type: "number",
      default: 1.5,
      min: 0.5,
      max: 6,
      step: 0.5,
      description: "Typing stagger",
      hiddenFromList: false,
    },
    cellSize: {
      type: "number",
      default: 80,
      min: 40,
      max: 160,
      step: 4,
      description: "Cell size",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
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
  durationInFrames: 170,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
