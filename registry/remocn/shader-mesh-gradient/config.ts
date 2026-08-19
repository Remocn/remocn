import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderMeshGradientConfig: ComponentConfig = {
  componentName: "ShaderMeshGradient",
  importPath: "@/components/remocn/shader-mesh-gradient",
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
      max: 1.5,
      step: 0.05,
      default: 0.6,
      description: "Distortion",
      hiddenFromList: false,
    },
    swirl: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.1,
      description: "Swirl",
      hiddenFromList: false,
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
