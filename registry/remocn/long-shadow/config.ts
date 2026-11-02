import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const longShadowConfig: ComponentConfig = {
  componentName: "LongShadow",
  importPath: "@/components/remocn/long-shadow",
  controls: {
    angleFrom: {
      type: "number",
      default: 45,
      min: 0,
      max: 360,
      step: 5,
      description: "Start angle",
      hiddenFromList: false,
    },
    angleTo: {
      type: "number",
      default: 135,
      min: 0,
      max: 360,
      step: 5,
      description: "End angle",
      hiddenFromList: false,
    },
    fade: {
      type: "number",
      default: 0,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Fade",
      hiddenFromList: false,
    },
    shadowColor: {
      type: "color",
      default: "#ECEAE6",
      description: "Shadow",
    },
    background: {
      type: "color",
      default: "#FFFFFF",
      description: "Background",
    },
    iconColor: { type: "color", default: "#E5322D", description: "Badge" },
    checkColor: { type: "color", default: "#FFFFFF", description: "Check" },
  },
  durationInFrames: 70,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#FFFFFF" },
};
