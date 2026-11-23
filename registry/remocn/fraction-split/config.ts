import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const fractionSplitConfig: ComponentConfig = {
  componentName: "FractionSplit",
  importPath: "@/components/remocn/fraction-split",
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
    line: {
      type: "text-content",
      default: "Renders in 1/8 the time.",
      description: "Line",
    },
    highlight: {
      type: "text-content",
      default: "1/8",
      description: "Highlight",
    },
    accentPiece: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "Accent piece",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 12,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    radius: {
      type: "number",
      default: 8,
      min: 0,
      max: 40,
      step: 1,
      description: "Corner radius",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Schibsted Grotesk", grain: true }),
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
