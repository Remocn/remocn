import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderGemSmokeConfig: ComponentConfig = {
  componentName: "ShaderGemSmoke",
  importPath: "@/components/remocn/shader-gem-smoke",
  controls: {
    speed: {
      type: "number",
      min: 0,
      max: 3,
      step: 0.1,
      default: 1,
      description: "Speed",
      hiddenFromList: false,
    },
    colorBack: {
      type: "color",
      default: "#0a0a10",
      description: "Background",
    },
    innerDistortion: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.05,
      default: 0.8,
      description: "Inner distortion",
      hiddenFromList: false,
    },
    outerDistortion: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.05,
      default: 0.6,
      description: "Outer distortion",
      hiddenFromList: false,
    },
    size: {
      type: "number",
      min: 0.2,
      max: 1.5,
      step: 0.05,
      default: 0.8,
      description: "Size",
      hiddenFromList: false,
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
