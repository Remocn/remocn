import { halftonePrintExampleCode } from "@/components/docs/examples/halftone-print-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const halftonePrintConfig: ComponentConfig = {
  componentName: "HalftonePrint",
  importPath: "@/components/remocn/halftone-print",
  controls: {
    dotSize: {
      type: "number",
      min: 4,
      max: 32,
      step: 1,
      default: 10,
      description: "Dot size",
      hiddenFromList: false,
    },
    angle: {
      type: "number",
      min: 0,
      max: 90,
      step: 1,
      default: 0,
      description: "Screen angle",
      hiddenFromList: false,
    },
    misregistration: {
      type: "number",
      min: 0,
      max: 6,
      step: 0.2,
      default: 1.2,
      description: "Misregistration",
      hiddenFromList: false,
    },
    paperTint: {
      type: "color",
      default: "#f4efe4",
      description: "Paper",
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#26231d" },
  snippet: halftonePrintExampleCode,
};
