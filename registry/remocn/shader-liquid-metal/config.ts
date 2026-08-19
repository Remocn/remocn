import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderLiquidMetalConfig: ComponentConfig = {
  componentName: "ShaderLiquidMetal",
  importPath: "@/components/remocn/shader-liquid-metal",
  controls: {
    speed: {
      type: "number",
      min: 0.1,
      max: 4,
      step: 0.1,
      default: 1,
      description: "Speed",
      hiddenFromList: false,
    },
    distortion: {
      type: "number",
      min: 0,
      max: 0.5,
      step: 0.01,
      default: 0.1,
      description: "Distortion",
      hiddenFromList: false,
    },
    repetition: {
      type: "number",
      min: 1,
      max: 6,
      step: 0.5,
      default: 1.5,
      description: "Repetition",
      hiddenFromList: false,
    },
    contour: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.4,
      description: "Contour",
      hiddenFromList: false,
    },
    colorBack: {
      type: "color",
      default: "#2a2a30",
      description: "Background",
    },
    colorTint: {
      type: "color",
      default: "#8a8a95",
      description: "Tint",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
