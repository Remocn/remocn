import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const infiniteBentoPanConfig: ComponentConfig = {
  componentName: "InfiniteBentoPan",
  importPath: "@/components/remocn/infinite-bento-pan",
  controls: {
    panSpeed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 3,
      step: 0.25,
      label: "Pan speed",
    },
    accentColor: {
      type: "color",
      default: "#7c3aed",
      label: "Accent color",
    },
  },
  durationInFrames: 300,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#050505" },
};
