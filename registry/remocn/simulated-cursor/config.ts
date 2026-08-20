import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const simulatedCursorConfig: ComponentConfig = {
  componentName: "SimulatedCursor",
  importPath: "@/components/remocn/simulated-cursor",
  controls: {
    color: {
      type: "color",
      default: "#ffffff",
      description: "Color",
    },
    size: {
      type: "number",
      min: 12,
      max: 96,
      step: 1,
      default: 32,
      description: "Size",
      hiddenFromList: false,
    },
  },
  dimensions: { width: 890, height: 450 },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
};
