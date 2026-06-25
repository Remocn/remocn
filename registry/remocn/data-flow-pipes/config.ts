import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const dataFlowPipesConfig: ComponentConfig = {
  componentName: "DataFlowPipes",
  importPath: "@/components/remocn/data-flow-pipes",
  controls: {
    pipeColor: { type: "color", default: "#1f1f23", label: "Pipe color" },
    pulseColor: { type: "color", default: "#22d3ee", label: "Pulse color" },
    pulseLength: {
      type: "number",
      default: 60,
      min: 10,
      max: 200,
      step: 5,
      label: "Pulse length",
    },
    pulseDuration: {
      type: "number",
      default: 36,
      min: 8,
      max: 120,
      step: 1,
      label: "Pulse duration",
    },
    nodeColor: { type: "color", default: "#0a0a0a", label: "Node color" },
    textColor: { type: "color", default: "#fafafa", label: "Text color" },
  },
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#050505" },
};
