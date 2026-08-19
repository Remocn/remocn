import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderDitheringConfig: ComponentConfig = {
  componentName: "ShaderDithering",
  importPath: "@/components/remocn/shader-dithering",
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
    size: {
      type: "number",
      min: 1,
      max: 8,
      step: 1,
      default: 2,
      description: "Dot Size",
      hiddenFromList: false,
    },
    colorBack: {
      type: "color",
      default: "#12121a",
      description: "Background",
    },
    colorFront: {
      type: "color",
      default: "#6a6a85",
      description: "Front",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
