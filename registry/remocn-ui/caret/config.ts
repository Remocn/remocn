import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const caretConfig: ComponentConfig = {
  componentName: "Caret",
  importPath: "@/components/remocn/caret",
  controls: {
    height: {
      type: "number",
      min: 8,
      max: 80,
      step: 2,
      default: 28,
      description: "Height",
      hiddenFromList: false,
    },
    width: {
      type: "number",
      min: 1,
      max: 8,
      step: 1,
      default: 3,
      description: "Width",
      hiddenFromList: false,
    },
    radius: {
      type: "number",
      min: 0,
      max: 8,
      step: 1,
      default: 1,
      description: "Radius",
      hiddenFromList: false,
    },
    blink: {
      type: "boolean",
      default: true,
      description: "Blink",
    },
    blinkPerSecond: {
      type: "number",
      min: 0.25,
      max: 4,
      step: 0.25,
      default: 1,
      description: "Blink/sec",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#1F1E1D",
      description: "Color",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
