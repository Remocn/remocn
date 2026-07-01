import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderSwirlConfig: ComponentConfig = {
  componentName: "ShaderSwirl",
  importPath: "@/components/remocn/shader-swirl",
  controls: {
    speed: {
      type: "number",
      default: 1,
      min: 0.1,
      max: 4,
      step: 0.1,
      label: "Speed",
    },
    bandCount: {
      type: "number",
      default: 4,
      min: 1,
      max: 12,
      step: 1,
      label: "Bands",
    },
    twist: {
      type: "number",
      default: 0.1,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Twist",
    },
    softness: {
      type: "number",
      default: 0.2,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Softness",
    },
    colorBack: { type: "color", default: "#12121a", label: "Background" },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
