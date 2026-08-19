import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderWaterConfig: ComponentConfig = {
  componentName: "ShaderWater",
  importPath: "@/components/remocn/shader-water",
  controls: {
    speed: {
      type: "number",
      min: 0.1,
      max: 4,
      step: 0.1,
      default: 1,
      description: "Speed",
      hiddenFromList: false,
    },
    waves: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.3,
      description: "Waves",
      hiddenFromList: false,
    },
    caustic: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.02,
      default: 0.08,
      description: "Caustic",
      hiddenFromList: false,
    },
    highlights: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.02,
      default: 0.06,
      description: "Highlights",
      hiddenFromList: false,
    },
    colorBack: {
      type: "color",
      default: "#16202b",
      description: "Background",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
