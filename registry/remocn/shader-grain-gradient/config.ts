import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderGrainGradientConfig: ComponentConfig = {
  componentName: "ShaderGrainGradient",
  importPath: "@/components/remocn/shader-grain-gradient",
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
    softness: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.6,
      description: "Softness",
      hiddenFromList: false,
    },
    intensity: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.2,
      description: "Intensity",
      hiddenFromList: false,
    },
    noise: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.15,
      description: "Noise",
      hiddenFromList: false,
    },
    colorBack: {
      type: "color",
      default: "#12121a",
      description: "Background",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
