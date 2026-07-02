import { waveWipeExampleCode } from "@/components/docs/examples/wave-wipe-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const waveWipeConfig: ComponentConfig = {
  componentName: "waveWipe",
  importPath: "@/components/remocn/wave-wipe",
  controls: {
    intensity: {
      type: "number",
      default: 0.2,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Intensity",
    },
    softness: {
      type: "number",
      default: 0.7,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Softness",
    },
    noise: {
      type: "number",
      default: 0.4,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Noise",
    },
    colorBack: { type: "color", default: "#141318", label: "Background" },
  },
  durationInFrames: 116,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: waveWipeExampleCode,
};
