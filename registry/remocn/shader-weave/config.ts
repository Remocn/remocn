import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderWeaveConfig: ComponentConfig = {
  componentName: "ShaderWeave",
  importPath: "@/components/remocn/shader-weave",
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
      min: 6,
      max: 48,
      step: 1,
      default: 22,
      description: "Scale",
      hiddenFromList: false,
    },
    warp: {
      type: "number",
      min: 0,
      max: 0.2,
      step: 0.01,
      default: 0.03,
      description: "Warp",
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
