import { zoomBlurExampleCode } from "@/components/docs/examples/zoom-blur-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const zoomBlurConfig: ComponentConfig = {
  componentName: "zoomBlur",
  importPath: "@/components/remocn/zoom-blur",
  controls: {
    blur: {
      type: "number",
      min: 0,
      max: 40,
      step: 2,
      default: 16,
      description: "Blur",
      hiddenFromList: false,
    },
    rise: {
      type: "number",
      min: 0,
      max: 160,
      step: 10,
      default: 0,
      description: "Rise",
      hiddenFromList: false,
    },
  },
  durationInFrames: 114,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
  snippet: zoomBlurExampleCode,
};
