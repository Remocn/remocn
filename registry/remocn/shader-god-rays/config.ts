import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderGodRaysConfig: ComponentConfig = {
  componentName: "ShaderGodRays",
  importPath: "@/components/remocn/shader-god-rays",
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
    intensity: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.05,
      default: 0.8,
      description: "Intensity",
      hiddenFromList: false,
    },
    density: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.3,
      description: "Density",
      hiddenFromList: false,
    },
    bloom: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.4,
      description: "Bloom",
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
