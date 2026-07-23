import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderCausticsConfig: ComponentConfig = {
  componentName: "ShaderCaustics",
  importPath: "@/components/remocn/shader-caustics",
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
      default: 5.2,
      min: 1,
      max: 12,
      step: 0.1,
      label: "Scale",
    },
    intensity: {
      type: "number",
      default: 1,
      min: 0,
      max: 2,
      step: 0.1,
      label: "Intensity",
    },
    accent: { type: "color", default: "#7F57FF", label: "Accent" },
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
