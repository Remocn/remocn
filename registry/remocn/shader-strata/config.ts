import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderStrataConfig: ComponentConfig = {
  componentName: "ShaderStrata",
  importPath: "@/components/remocn/shader-strata",
  controls: {
    speed: {
      type: "number",
      default: 1,
      min: 0,
      max: 3,
      step: 0.1,
      label: "Speed",
    },
    layers: {
      type: "number",
      default: 14,
      min: 4,
      max: 30,
      step: 1,
      label: "Layers",
    },
    amplitude: {
      type: "number",
      default: 0.16,
      min: 0,
      max: 0.5,
      step: 0.01,
      label: "Amplitude",
    },
    accent: { type: "color", default: "#6733FF", label: "Accent" },
    accentAmount: {
      type: "number",
      default: 0,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Accent amount",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
