import { whipPanExampleCode } from "@/components/docs/examples/whip-pan-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const whipPanConfig: ComponentConfig = {
  componentName: "whipPan",
  importPath: "@/components/remocn/whip-pan",
  controls: {
    direction: {
      type: "select",
      default: "left",
      options: ["left", "right", "up", "down"],
      label: "Direction",
    },
    blur: {
      type: "number",
      default: 24,
      min: 0,
      max: 48,
      step: 2,
      label: "Blur",
    },
  },
  durationInFrames: 114,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: whipPanExampleCode,
};
