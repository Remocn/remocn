import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderVoronoiConfig: ComponentConfig = {
  componentName: "ShaderVoronoi",
  importPath: "@/components/remocn/shader-voronoi",
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
    distortion: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.4,
      description: "Distortion",
      hiddenFromList: false,
    },
    gap: {
      type: "number",
      min: 0,
      max: 0.2,
      step: 0.01,
      default: 0.04,
      description: "Gap",
      hiddenFromList: false,
    },
    glow: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0,
      description: "Glow",
      hiddenFromList: false,
    },
    colorGap: {
      type: "color",
      default: "#12121a",
      description: "Gap Color",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
