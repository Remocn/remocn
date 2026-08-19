import { waveWipeExampleCode } from "@/components/docs/examples/wave-wipe-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const waveWipeConfig: ComponentConfig = {
  componentName: "waveWipe",
  importPath: "@/components/remocn/wave-wipe",
  controls: {
    intensity: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.2,
      description: "Intensity",
      hiddenFromList: false,
    },
    softness: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.7,
      description: "Softness",
      hiddenFromList: false,
    },
    noise: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.4,
      description: "Noise",
      hiddenFromList: false,
    },
    colorBack: {
      type: "color",
      default: "#141318",
      description: "Background",
    },
  },
  durationInFrames: 116,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: waveWipeExampleCode,
};
