import { whipPanExampleCode } from "@/components/docs/examples/whip-pan-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const whipPanConfig: ComponentConfig = {
  componentName: "whipPan",
  importPath: "@/components/remocn/whip-pan",
  controls: {
    direction: {
      type: "enum",
      default: "left",
      variants: {
        left: {},
        right: {},
        up: {},
        down: {},
      },
      description: "Direction",
    },
    blur: {
      type: "number",
      min: 0,
      max: 48,
      step: 2,
      default: 24,
      description: "Blur",
      hiddenFromList: false,
    },
  },
  durationInFrames: 114,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: whipPanExampleCode,
};
