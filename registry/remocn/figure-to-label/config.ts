import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const figureToLabelConfig: ComponentConfig = {
  componentName: "FigureToLabel",
  importPath: "@/components/remocn/figure-to-label",
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
    value: {
      type: "text-content",
      default: "$6.4B",
      description: "Value",
    },
    word: {
      type: "text-content",
      default: "valuation",
      description: "Word",
    },
    eyebrow: {
      type: "text-content",
      default: "",
      description: "Eyebrow",
    },
    fontWeight: {
      type: "number",
      default: 300,
      min: 100,
      max: 900,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2,
      min: 1,
      max: 8,
      step: 1,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Onest" }),
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
  durationInFrames: 138,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
