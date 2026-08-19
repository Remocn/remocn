import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderSwirlConfig: ComponentConfig = {
  componentName: "ShaderSwirl",
  importPath: "@/components/remocn/shader-swirl",
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
    bandCount: {
      type: "number",
      min: 1,
      max: 12,
      step: 1,
      default: 4,
      description: "Bands",
      hiddenFromList: false,
    },
    twist: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.1,
      description: "Twist",
      hiddenFromList: false,
    },
    softness: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.2,
      description: "Softness",
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
