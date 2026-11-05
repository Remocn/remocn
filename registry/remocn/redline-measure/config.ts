import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const redlineMeasureConfig: ComponentConfig = {
  componentName: "RedlineMeasure",
  importPath: "@/components/remocn/redline-measure",
  controls: {
    color: { type: "color", default: "#FB3748", description: "Marks" },
    background: {
      type: "color",
      default: "#EDEDEF",
      description: "Background",
    },
    dim: {
      type: "number",
      min: 0,
      max: 0.6,
      step: 0.02,
      default: 0.18,
      description: "Dim UI",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      min: 1,
      max: 12,
      step: 1,
      default: 5,
      description: "Stagger",
      hiddenFromList: false,
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#EDEDEF" },
  card: { fit: false },
};
