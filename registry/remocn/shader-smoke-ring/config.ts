import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderSmokeRingConfig: ComponentConfig = {
  componentName: "ShaderSmokeRing",
  importPath: "@/components/remocn/shader-smoke-ring",
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
    radius: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.25,
      description: "Radius",
      hiddenFromList: false,
    },
    thickness: {
      type: "number",
      min: 0.1,
      max: 1.5,
      step: 0.05,
      default: 0.65,
      description: "Thickness",
      hiddenFromList: false,
    },
    scale: {
      type: "number",
      min: 0.3,
      max: 2,
      step: 0.05,
      default: 0.8,
      description: "Scale",
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
