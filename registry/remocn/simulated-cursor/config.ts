import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const simulatedCursorConfig: ComponentConfig = {
  componentName: "SimulatedCursor",
  importPath: "@/components/remocn/simulated-cursor",
  controls: {
    color: { type: "color", default: "#ffffff", label: "Color" },
    size: {
      type: "number",
      default: 32,
      min: 12,
      max: 96,
      step: 1,
      label: "Size",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
