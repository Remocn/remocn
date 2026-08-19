import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderSpiralConfig: ComponentConfig = {
  componentName: "ShaderSpiral",
  importPath: "@/components/remocn/shader-spiral",
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
    density: {
      type: "number",
      min: 0.2,
      max: 4,
      step: 0.1,
      default: 1,
      description: "Density",
      hiddenFromList: false,
    },
    strokeWidth: {
      type: "number",
      min: 0.05,
      max: 1,
      step: 0.05,
      default: 0.5,
      description: "Stroke",
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
