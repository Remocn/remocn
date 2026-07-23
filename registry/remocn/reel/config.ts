import { reelExampleCode } from "@/components/docs/examples/reel-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const reelConfig: ComponentConfig = {
  componentName: "Reel",
  importPath: "@/components/remocn/reel",
  controls: {
    width: {
      type: "number",
      default: 1180,
      min: 600,
      max: 1280,
      step: 20,
      label: "Card width",
    },
    height: {
      type: "number",
      default: 676,
      min: 360,
      max: 720,
      step: 4,
      label: "Card height",
    },
    radius: {
      type: "number",
      default: 16,
      min: 0,
      max: 40,
      step: 1,
      label: "Corner radius",
    },
    step: {
      type: "number",
      default: 20,
      min: 6,
      max: 40,
      step: 1,
      label: "Frames / image",
    },
    reveal: {
      type: "number",
      default: 13,
      min: 4,
      max: 30,
      step: 1,
      label: "Reveal frames",
    },
  },
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0b0b0c" },
  snippet: reelExampleCode,
};
