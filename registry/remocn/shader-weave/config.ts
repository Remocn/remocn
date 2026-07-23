import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderWeaveConfig: ComponentConfig = {
  componentName: "ShaderWeave",
  importPath: "@/components/remocn/shader-weave",
  controls: {
    speed: {
      type: "number",
      default: 1,
      min: 0,
      max: 3,
      step: 0.1,
      label: "Speed",
    },
    scale: {
      type: "number",
      default: 22,
      min: 6,
      max: 48,
      step: 1,
      label: "Scale",
    },
    warp: {
      type: "number",
      default: 0.03,
      min: 0,
      max: 0.2,
      step: 0.01,
      label: "Warp",
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
