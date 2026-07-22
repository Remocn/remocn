import { polaroidExampleCode } from "@/components/docs/examples/polaroid-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const polaroidConfig: ComponentConfig = {
  componentName: "Polaroid",
  importPath: "@/components/remocn/polaroid",
  controls: {
    caption: { type: "text", default: "first light", label: "Caption" },
    captionAt: {
      type: "number",
      default: 0,
      min: 0,
      max: 60,
      step: 1,
      label: "Caption starts",
    },
    width: {
      type: "number",
      default: 652,
      min: 320,
      max: 900,
      step: 4,
      label: "Card width",
    },
    captionSize: {
      type: "number",
      default: 36,
      min: 20,
      max: 56,
      step: 1,
      label: "Caption size",
    },
    step: {
      type: "number",
      default: 3,
      min: 1,
      max: 6,
      step: 1,
      label: "Frames / pose",
    },
  },
  snippet: polaroidExampleCode,
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
};
