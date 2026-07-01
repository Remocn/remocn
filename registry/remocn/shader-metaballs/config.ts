import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderMetaballsConfig: ComponentConfig = {
  componentName: "ShaderMetaballs",
  importPath: "@/components/remocn/shader-metaballs",
  controls: {
    speed: {
      type: "number",
      default: 1,
      min: 0.1,
      max: 4,
      step: 0.1,
      label: "Speed",
    },
    count: {
      type: "number",
      default: 10,
      min: 1,
      max: 20,
      step: 1,
      label: "Count",
    },
    size: {
      type: "number",
      default: 0.83,
      min: 0.2,
      max: 1.5,
      step: 0.05,
      label: "Size",
    },
    colorBack: { type: "color", default: "#12121a", label: "Background" },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
