import { shaderSeamExampleCode } from "@/components/docs/examples/shader-seam-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const shaderSeamConfig: ComponentConfig = {
  componentName: "shaderSeam",
  importPath: "@/components/remocn/shader-seam",
  controls: {
    softness: {
      type: "number",
      default: 0.18,
      min: 0.02,
      max: 0.4,
      step: 0.01,
      description: "Dissolve softness",
      hiddenFromList: false,
    },
    detail: {
      type: "number",
      default: 0.65,
      min: 0,
      max: 1,
      step: 0.01,
      description: "Organic detail",
      hiddenFromList: false,
    },
    timeOffset: {
      type: "number",
      default: 0,
      min: 0,
      max: 30,
      step: 0.5,
      description: "Shader start time",
      hiddenFromList: false,
    },
    speed: {
      type: "number",
      default: 0,
      min: 0,
      max: 3,
      step: 0.25,
      description: "Shader speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 156,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#14121c" },
  snippet: shaderSeamExampleCode,
};
