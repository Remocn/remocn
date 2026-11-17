import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const uncommentLineConfig: ComponentConfig = {
  componentName: "UncommentLine",
  importPath: "@/components/remocn/uncomment-line",
  lists: {
    lines: {
      default: ["Fork the scenes.", "Change anything.", "Own the cut."],
      description: "Lines",
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
    marker: {
      type: "text-content",
      default: "// ",
      description: "Marker",
    },
    highlight: {
      type: "number",
      default: -1,
      min: -10,
      max: 10,
      step: 1,
      description: "Highlight",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 13,
      min: 2,
      max: 30,
      step: 1,
      description: "Line stagger",
      hiddenFromList: false,
    },
    dim: {
      type: "number",
      default: 0.28,
      min: 0,
      max: 1,
      step: 0.02,
      description: "Commented dim",
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
  durationInFrames: 125,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
