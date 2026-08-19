import { paperWobbleExampleCode } from "@/components/docs/examples/paper-wobble-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const paperWobbleConfig: ComponentConfig = {
  componentName: "PaperWobble",
  importPath: "@/components/remocn/paper-wobble",
  controls: {
    amp: {
      type: "number",
      min: 0,
      max: 6,
      step: 0.1,
      default: 1.4,
      description: "Offset",
      hiddenFromList: false,
    },
    rotAmp: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.05,
      default: 0.35,
      description: "Rotation",
      hiddenFromList: false,
    },
    seed: {
      type: "text-content",
      default: "wobble",
      description: "Seed",
    },
    step: {
      type: "number",
      min: 1,
      max: 6,
      step: 1,
      default: 3,
      description: "Frames / pose",
      hiddenFromList: false,
    },
  },
  snippet: paperWobbleExampleCode,
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
};
