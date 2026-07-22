import { paperWobbleExampleCode } from "@/components/docs/examples/paper-wobble-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const paperWobbleConfig: ComponentConfig = {
  componentName: "PaperWobble",
  importPath: "@/components/remocn/paper-wobble",
  controls: {
    amp: {
      type: "number",
      default: 1.4,
      min: 0,
      max: 6,
      step: 0.1,
      label: "Offset",
    },
    rotAmp: {
      type: "number",
      default: 0.35,
      min: 0,
      max: 2,
      step: 0.05,
      label: "Rotation",
    },
    seed: { type: "text", default: "wobble", label: "Seed" },
    step: {
      type: "number",
      default: 3,
      min: 1,
      max: 6,
      step: 1,
      label: "Frames / pose",
    },
  },
  snippet: paperWobbleExampleCode,
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
};
