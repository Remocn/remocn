import { pushThroughExampleCode } from "@/components/docs/examples/push-through-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const pushThroughConfig: ComponentConfig = {
  componentName: "pushThrough",
  importPath: "@/components/remocn/push-through",
  controls: {
    zoom: {
      type: "number",
      default: 2.4,
      min: 1.5,
      max: 4,
      step: 0.1,
      label: "Zoom",
    },
    blur: {
      type: "number",
      default: 14,
      min: 0,
      max: 30,
      step: 1,
      label: "Blur",
    },
  },
  durationInFrames: 112,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: pushThroughExampleCode,
};
