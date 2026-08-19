import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderStrataConfig: ComponentConfig = {
  componentName: "ShaderStrata",
  importPath: "@/components/remocn/shader-strata",
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
    layers: {
      type: "number",
      min: 4,
      max: 30,
      step: 1,
      default: 14,
      description: "Layers",
      hiddenFromList: false,
    },
    amplitude: {
      type: "number",
      min: 0,
      max: 0.5,
      step: 0.01,
      default: 0.16,
      description: "Amplitude",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#6733FF",
      description: "Accent",
    },
    accentAmount: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0,
      description: "Accent amount",
      hiddenFromList: false,
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
