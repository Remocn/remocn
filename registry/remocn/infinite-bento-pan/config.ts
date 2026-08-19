import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const infiniteBentoPanConfig: ComponentConfig = {
  componentName: "InfiniteBentoPan",
  importPath: "@/components/remocn/infinite-bento-pan",
  controls: {
    panSpeed: {
      type: "number",
      min: 0.25,
      max: 3,
      step: 0.25,
      default: 1,
      description: "Pan speed",
      hiddenFromList: false,
    },
    accentColor: {
      type: "color",
      default: "#7c3aed",
      description: "Accent color",
    },
  },
  durationInFrames: 300,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#050505" },
};
