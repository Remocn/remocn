import { risoPrintExampleCode } from "@/components/docs/examples/riso-print-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const risoPrintConfig: ComponentConfig = {
  componentName: "RisoPrint",
  importPath: "@/components/remocn/riso-print",
  controls: {
    keyInk: { type: "color", default: "#111111", description: "Key ink" },
    accentInk: {
      type: "color",
      default: "#E5322D",
      description: "Accent ink",
    },
    paper: { type: "color", default: "#F2F0EA", description: "Paper" },
    grain: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      description: "Grain",
      hiddenFromList: false,
    },
    jitter: {
      type: "number",
      default: 1.2,
      min: 0,
      max: 6,
      step: 0.1,
      description: "Jitter",
      hiddenFromList: false,
    },
    marks: {
      type: "boolean",
      default: true,
      description: "Registration marks",
    },
  },
  durationInFrames: 75,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#F2F0EA" },
  snippet: risoPrintExampleCode,
};
