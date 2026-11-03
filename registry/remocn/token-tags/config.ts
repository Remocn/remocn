import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tokenTagsConfig: ComponentConfig = {
  componentName: "TokenTags",
  importPath: "@/components/remocn/token-tags",
  controls: {
    lineColor: { type: "color", default: "#0E121B", description: "Leaders" },
    background: {
      type: "color",
      default: "#EDEDEF",
      description: "Background",
    },
    stagger: {
      type: "number",
      min: 1,
      max: 12,
      step: 1,
      default: 6,
      description: "Stagger",
      hiddenFromList: false,
    },
  },
  durationInFrames: 88,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#EDEDEF" },
  card: { fit: false },
};
