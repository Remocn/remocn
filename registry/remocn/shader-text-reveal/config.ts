import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderTextRevealConfig: ComponentConfig = {
  componentName: "ShaderTextReveal",
  importPath: "@/components/remocn/shader-text-reveal",
  controls: {
    text: {
      type: "text-content",
      default: "Your product",
      description: "Text",
    },
    fontSize: {
      type: "number",
      default: 400,
      min: 24,
      max: 500,
      step: 1,
      description: "Font size",
      hiddenFromList: false,
    },
    wordDuration: {
      type: "number",
      default: 30,
      min: 12,
      max: 90,
      step: 1,
      description: "Frames per word",
      hiddenFromList: false,
    },
    intensity: {
      type: "number",
      default: 1,
      min: 0,
      max: 1,
      step: 0.01,
      description: "Hero shader strength",
      hiddenFromList: false,
    },
  },
  durationInFrames: 75,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#000000" },
};
