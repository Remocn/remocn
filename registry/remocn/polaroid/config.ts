import { polaroidExampleCode } from "@/components/docs/examples/polaroid-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const polaroidConfig: ComponentConfig = {
  componentName: "Polaroid",
  importPath: "@/components/remocn/polaroid",
  controls: {
    caption: {
      type: "text-content",
      default: "first light",
      description: "Caption",
    },
    captionAt: {
      type: "number",
      min: 0,
      max: 60,
      step: 1,
      default: 0,
      description: "Caption starts",
      hiddenFromList: false,
    },
    width: {
      type: "number",
      min: 320,
      max: 900,
      step: 4,
      default: 652,
      description: "Card width",
      hiddenFromList: false,
    },
    captionSize: {
      type: "number",
      min: 20,
      max: 56,
      step: 1,
      default: 36,
      description: "Caption size",
      hiddenFromList: false,
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
  snippet: polaroidExampleCode,
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
};
