import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderDotOrbitConfig: ComponentConfig = {
  componentName: "ShaderDotOrbit",
  importPath: "@/components/remocn/shader-dot-orbit",
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
      min: 0.1,
      max: 3,
      step: 0.1,
      default: 1,
      description: "Size",
      hiddenFromList: false,
    },
    spreading: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.1,
      default: 1,
      description: "Spreading",
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
