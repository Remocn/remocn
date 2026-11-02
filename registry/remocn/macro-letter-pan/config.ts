import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const macroLetterPanConfig: ComponentConfig = {
  componentName: "MacroLetterPan",
  importPath: "@/components/remocn/macro-letter-pan",
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
      default: "Ready to launch.",
      description: "Line",
    },
    word: {
      type: "text-content",
      default: "launch",
      description: "Word",
    },
    firstShot: {
      type: "number",
      default: 15,
      min: 0,
      max: 45,
      step: 1,
      description: "First shot",
      hiddenFromList: false,
    },
    maxShots: {
      type: "number",
      default: 6,
      min: 0,
      max: 18,
      step: 1,
      description: "Max shots",
      hiddenFromList: false,
    },
  },
  durationInFrames: 129,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
