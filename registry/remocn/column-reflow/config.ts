import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const columnReflowConfig: ComponentConfig = {
  componentName: "ColumnReflow",
  importPath: "@/components/remocn/column-reflow",
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
    text: {
      type: "text-content",
      default:
        "Good motion starts with good typography. Give every word a measure, room to breathe, and a rhythm the eye can trust, then let the layout move and the story will read itself.",
      description: "Text",
    },
    accentWord: {
      type: "text-content",
      default: "room",
      description: "Accent word",
    },
    direction: {
      type: "enum",
      default: "widen",
      variants: {
        widen: {},
        narrow: {},
      },
      description: "Direction",
    },
    measure: {
      type: "number",
      default: 9.6,
      min: 6,
      max: 14,
      step: 0.2,
      description: "Column width (em)",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Newsreader", grain: true }),
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
