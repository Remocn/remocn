import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderDotOrbitConfig: ComponentConfig = {
  componentName: "ShaderDotOrbit",
  importPath: "@/components/remocn/shader-dot-orbit",
  controls: {
    speed: {
      type: "number",
      default: 1,
      min: 0.1,
      max: 4,
      step: 0.1,
      label: "Speed",
    },
    size: {
      type: "number",
      default: 1,
      min: 0.1,
      max: 3,
      step: 0.1,
      label: "Size",
    },
    spreading: {
      type: "number",
      default: 1,
      min: 0,
      max: 2,
      step: 0.1,
      label: "Spreading",
    },
    colorBack: { type: "color", default: "#12121a", label: "Background" },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
