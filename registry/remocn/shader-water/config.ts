import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderWaterConfig: ComponentConfig = {
  componentName: "ShaderWater",
  importPath: "@/components/remocn/shader-water",
  controls: {
    speed: {
      type: "number",
      default: 1,
      min: 0.1,
      max: 4,
      step: 0.1,
      label: "Speed",
    },
    waves: {
      type: "number",
      default: 0.3,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Waves",
    },
    caustic: {
      type: "number",
      default: 0.08,
      min: 0,
      max: 1,
      step: 0.02,
      label: "Caustic",
    },
    highlights: {
      type: "number",
      default: 0.06,
      min: 0,
      max: 1,
      step: 0.02,
      label: "Highlights",
    },
    colorBack: { type: "color", default: "#16202b", label: "Background" },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
