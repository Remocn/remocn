import { paperStickerExampleCode } from "@/components/docs/examples/paper-sticker-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const paperStickerConfig: ComponentConfig = {
  componentName: "PaperSticker",
  importPath: "@/components/remocn/paper-sticker",
  controls: {
    at: {
      type: "number",
      default: 0,
      min: 0,
      max: 60,
      step: 1,
      label: "Slap frame",
    },
    padding: { type: "text", default: "10px 16px", label: "Padding" },
    background: { type: "color", default: "#fbfaf6", label: "Paper" },
    maxTilt: {
      type: "number",
      default: 2.6,
      min: 0,
      max: 8,
      step: 0.2,
      label: "Max tilt",
    },
    seed: { type: "text", default: "sticker", label: "Seed" },
    step: {
      type: "number",
      default: 3,
      min: 1,
      max: 6,
      step: 1,
      label: "Frames / pose",
    },
  },
  snippet: paperStickerExampleCode,
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
};
