import { securityCamExampleCode } from "@/components/docs/examples/security-cam-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const securityCamConfig: ComponentConfig = {
  componentName: "SecurityCam",
  importPath: "@/components/remocn/security-cam",
  controls: {
    compression: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.7,
      description: "Compression",
      hiddenFromList: false,
    },
    blockSize: {
      type: "number",
      min: 4,
      max: 32,
      step: 1,
      default: 10,
      description: "Macroblock",
      hiddenFromList: false,
    },
    noise: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.05,
      default: 0.6,
      description: "Sensor noise",
      hiddenFromList: false,
    },
    intensity: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 1,
      description: "Intensity",
      hiddenFromList: false,
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: securityCamExampleCode,
};
