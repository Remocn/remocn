import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderColorPanelsConfig: ComponentConfig = {
  componentName: "ShaderColorPanels",
  importPath: "@/components/remocn/shader-color-panels",
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
    density: {
      type: "number",
      min: 1,
      max: 8,
      step: 1,
      default: 3,
      description: "Density",
      hiddenFromList: false,
    },
    length: {
      type: "number",
      min: 0.5,
      max: 3,
      step: 0.1,
      default: 1.1,
      description: "Length",
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
