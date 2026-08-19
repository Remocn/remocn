import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderCausticsConfig: ComponentConfig = {
  componentName: "ShaderCaustics",
  importPath: "@/components/remocn/shader-caustics",
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
    scale: {
      type: "number",
      min: 1,
      max: 12,
      step: 0.1,
      default: 5.2,
      description: "Scale",
      hiddenFromList: false,
    },
    intensity: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.1,
      default: 1,
      description: "Intensity",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#7F57FF",
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
