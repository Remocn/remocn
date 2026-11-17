import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const photoCaretConfig: ComponentConfig = {
  componentName: "PhotoCaret",
  importPath: "@/components/remocn/photo-caret",
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
      default: "Your launch, / your name / on it.",
      description: "Text",
    },
    accentWord: {
      type: "text-content",
      default: "it.",
      description: "Accent word",
    },
    firstStep: {
      type: "number",
      default: 12,
      min: 0,
      max: 36,
      step: 1,
      description: "First step",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 45,
      min: 0,
      max: 120,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accentFont: {
      type: "font-family",
      default: "Instrument Serif",
      description: "Accent font",
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Figtree" }),
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
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
