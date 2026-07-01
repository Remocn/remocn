import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderSmokeRingConfig: ComponentConfig = {
  componentName: "ShaderSmokeRing",
  importPath: "@/components/remocn/shader-smoke-ring",
  controls: {
    speed: {
      type: "number",
      default: 1,
      min: 0.1,
      max: 4,
      step: 0.1,
      label: "Speed",
    },
    radius: {
      type: "number",
      default: 0.25,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Radius",
    },
    thickness: {
      type: "number",
      default: 0.65,
      min: 0.1,
      max: 1.5,
      step: 0.05,
      label: "Thickness",
    },
    scale: {
      type: "number",
      default: 0.8,
      min: 0.3,
      max: 2,
      step: 0.05,
      label: "Scale",
    },
    colorBack: { type: "color", default: "#12121a", label: "Background" },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
