import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderGemSmokeConfig: ComponentConfig = {
  componentName: "ShaderGemSmoke",
  importPath: "@/components/remocn/shader-gem-smoke",
  controls: {
    speed: {
      type: "number",
      default: 1,
      min: 0,
      max: 3,
      step: 0.1,
      label: "Speed",
    },
    colorBack: { type: "color", default: "#0a0a10", label: "Background" },
    innerDistortion: {
      type: "number",
      default: 0.8,
      min: 0,
      max: 2,
      step: 0.05,
      label: "Inner distortion",
    },
    outerDistortion: {
      type: "number",
      default: 0.6,
      min: 0,
      max: 2,
      step: 0.05,
      label: "Outer distortion",
    },
    size: {
      type: "number",
      default: 0.8,
      min: 0.2,
      max: 1.5,
      step: 0.05,
      label: "Size",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
