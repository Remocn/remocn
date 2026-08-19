import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderPulsingBorderConfig: ComponentConfig = {
  componentName: "ShaderPulsingBorder",
  importPath: "@/components/remocn/shader-pulsing-border",
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
    thickness: {
      type: "number",
      min: 0.02,
      max: 0.5,
      step: 0.02,
      default: 0.1,
      description: "Thickness",
      hiddenFromList: false,
    },
    roundness: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.25,
      description: "Roundness",
      hiddenFromList: false,
    },
    intensity: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.2,
      description: "Intensity",
      hiddenFromList: false,
    },
    colorBack: {
      type: "color",
      default: "#12121a",
      description: "Background",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
