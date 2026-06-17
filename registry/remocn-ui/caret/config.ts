import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const caretConfig: ComponentConfig = {
  componentName: "Caret",
  importPath: "@/components/remocn/caret",
  controls: {
    height: { type: "number", default: 28, min: 8, max: 80, step: 2, label: "Height" },
    width: { type: "number", default: 3, min: 1, max: 8, step: 1, label: "Width" },
    radius: { type: "number", default: 1, min: 0, max: 8, step: 1, label: "Radius" },
    blink: { type: "boolean", default: true, label: "Blink" },
    blinkPerSecond: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      label: "Blink/sec",
    },
    color: { type: "color", default: "#1F1E1D", label: "Color" },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
