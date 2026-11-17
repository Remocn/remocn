import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const singleStrokeConfig: ComponentConfig = {
  componentName: "SingleStroke",
  importPath: "@/components/remocn/single-stroke",
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
      default: "27",
      description: "Value",
    },
    unit: {
      type: "text-content",
      default: "Mar",
      description: "Unit",
    },
    label: {
      type: "text-content",
      default: "Demo day. Every team shows a film.",
      description: "Label",
    },
    drawDuration: {
      type: "number",
      default: 46,
      min: 10,
      max: 120,
      step: 1,
      description: "Draw (frames)",
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
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Archivo" }),
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
