import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderSimplexNoiseConfig: ComponentConfig = {
  componentName: "ShaderSimplexNoise",
  importPath: "@/components/remocn/shader-simplex-noise",
  controls: {
    speed: {
      type: "number",
      default: 1,
      min: 0.1,
      max: 4,
      step: 0.1,
      label: "Speed",
    },
    stepsPerColor: {
      type: "number",
      default: 2,
      min: 1,
      max: 6,
      step: 1,
      label: "Steps",
    },
    softness: {
      type: "number",
      default: 0.1,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Softness",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
