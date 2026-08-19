import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderSimplexNoiseConfig: ComponentConfig = {
  componentName: "ShaderSimplexNoise",
  importPath: "@/components/remocn/shader-simplex-noise",
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
    stepsPerColor: {
      type: "number",
      min: 1,
      max: 6,
      step: 1,
      default: 2,
      description: "Steps",
      hiddenFromList: false,
    },
    softness: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.1,
      description: "Softness",
      hiddenFromList: false,
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
