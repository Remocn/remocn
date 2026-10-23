import { turntableExampleCode } from "@/components/docs/examples/turntable-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const turntableConfig: ComponentConfig = {
  componentName: "Turntable",
  importPath: "@/components/remocn/turntable",
  controls: {
    turns: {
      type: "number",
      default: 1,
      min: 0.5,
      max: 3,
      step: 0.5,
      description: "Turns",
      hiddenFromList: false,
    },
    thickness: {
      type: "number",
      default: 22,
      min: 2,
      max: 60,
      step: 1,
      description: "Thickness",
      hiddenFromList: false,
    },
    tilt: {
      type: "number",
      default: 8,
      min: -20,
      max: 30,
      step: 1,
      description: "Tilt",
      hiddenFromList: false,
    },
    frontColor: { type: "color", default: "#E5322D", description: "Front" },
    edgeColor: { type: "color", default: "#A3201C", description: "Edge" },
    backColor: { type: "color", default: "#F2F2F2", description: "Back" },
    backgroundColor: {
      type: "color",
      default: "#111111",
      description: "Background",
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: turntableExampleCode,
};
