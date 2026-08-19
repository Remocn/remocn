import { paperStickerExampleCode } from "@/components/docs/examples/paper-sticker-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const paperStickerConfig: ComponentConfig = {
  componentName: "PaperSticker",
  importPath: "@/components/remocn/paper-sticker",
  controls: {
    at: {
      type: "number",
      min: 0,
      max: 60,
      step: 1,
      default: 0,
      description: "Slap frame",
      hiddenFromList: false,
    },
    padding: {
      type: "text-content",
      default: "10px 16px",
      description: "Padding",
    },
    background: {
      type: "color",
      default: "#fbfaf6",
      description: "Paper",
    },
    maxTilt: {
      type: "number",
      min: 0,
      max: 8,
      step: 0.2,
      default: 2.6,
      description: "Max tilt",
      hiddenFromList: false,
    },
    seed: {
      type: "text-content",
      default: "sticker",
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
  snippet: paperStickerExampleCode,
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
};
