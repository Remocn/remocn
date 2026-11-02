import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const edgeFitConfig: ComponentConfig = {
  componentName: "EdgeFit",
  importPath: "@/components/remocn/edge-fit",
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
    caption: {
      type: "text-content",
      default: "Fresh from the registry",
      description: "Caption",
    },
    letterGap: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Letter gap",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 14,
      min: 0,
      max: 42,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
    },
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
