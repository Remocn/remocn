import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderColorPanelsConfig: ComponentConfig = {
  componentName: "ShaderColorPanels",
  importPath: "@/components/remocn/shader-color-panels",
  controls: {
    speed: {
      type: "number",
      default: 1,
      min: 0.1,
      max: 4,
      step: 0.1,
      label: "Speed",
    },
    density: {
      type: "number",
      default: 3,
      min: 1,
      max: 8,
      step: 1,
      label: "Density",
    },
    length: {
      type: "number",
      default: 1.1,
      min: 0.5,
      max: 3,
      step: 0.1,
      label: "Length",
    },
    colorBack: { type: "color", default: "#12121a", label: "Background" },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
