import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderMetaballsConfig: ComponentConfig = {
  componentName: "ShaderMetaballs",
  importPath: "@/components/remocn/shader-metaballs",
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
    count: {
      type: "number",
      min: 1,
      max: 20,
      step: 1,
      default: 10,
      description: "Count",
      hiddenFromList: false,
    },
    size: {
      type: "number",
      min: 0.2,
      max: 1.5,
      step: 0.05,
      default: 0.83,
      description: "Size",
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
