import { inkUnderlineExampleCode } from "@/components/docs/examples/ink-underline-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const inkUnderlineConfig: ComponentConfig = {
  componentName: "InkUnderline",
  importPath: "@/components/remocn/ink-underline",
  controls: {
    width: {
      type: "number",
      default: 420,
      min: 100,
      max: 800,
      step: 10,
      label: "Width",
    },
    color: { type: "color", default: "#6f7f35", label: "Ink color" },
    thickness: {
      type: "number",
      default: 9,
      min: 2,
      max: 24,
      step: 1,
      label: "Thickness",
    },
    durationSteps: {
      type: "number",
      default: 5,
      min: 2,
      max: 10,
      step: 1,
      label: "Poses to draw",
    },
    seed: { type: "text", default: "ink", label: "Seed" },
    step: {
      type: "number",
      default: 3,
      min: 1,
      max: 6,
      step: 1,
      label: "Frames / pose",
    },
  },
  snippet: inkUnderlineExampleCode,
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
};
