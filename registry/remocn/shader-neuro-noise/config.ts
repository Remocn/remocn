import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderNeuroNoiseConfig: ComponentConfig = {
  componentName: "ShaderNeuroNoise",
  importPath: "@/components/remocn/shader-neuro-noise",
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
    brightness: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.05,
      description: "Brightness",
      hiddenFromList: false,
    },
    contrast: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.3,
      description: "Contrast",
      hiddenFromList: false,
    },
    colorBack: {
      type: "color",
      default: "#12121a",
      description: "Background",
    },
    colorMid: {
      type: "color",
      default: "#4a4a68",
      description: "Mid",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
