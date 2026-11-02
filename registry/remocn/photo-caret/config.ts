import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

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
  },
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
