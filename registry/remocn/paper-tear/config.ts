import { paperTearExampleCode } from "@/components/docs/examples/paper-tear-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const paperTearConfig: ComponentConfig = {
  componentName: "paperTear",
  importPath: "@/components/remocn/paper-tear",
  controls: {
    impact: {
      type: "number",
      min: 0,
      max: 2,
      step: 0.1,
      default: 1,
      description: "Impact",
      hiddenFromList: false,
    },
    roughness: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
      description: "Roughness",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      min: 1,
      max: 50,
      step: 1,
      default: 7,
      description: "Seed",
      hiddenFromList: false,
    },
    edgeColor: {
      type: "color",
      default: "#FFFFFF",
      description: "Edge color",
    },
  },
  durationInFrames: 104,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#0a0a0a" },
  snippet: paperTearExampleCode,
};
