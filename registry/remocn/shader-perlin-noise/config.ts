import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderPerlinNoiseConfig: ComponentConfig = {
  componentName: "ShaderPerlinNoise",
  importPath: "@/components/remocn/shader-perlin-noise",
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
    proportion: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.35,
      description: "Proportion",
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
    colorBack: {
      type: "color",
      default: "#12121a",
      description: "Background",
    },
    colorFront: {
      type: "color",
      default: "#6a6a85",
      description: "Front",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
